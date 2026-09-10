import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ConfirmDialog";
import { onAppEvent } from "@/eventStream";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteAssignment,
  fetchAssignmentDetail,
  updateSubmissionStatus,
  type Assignment,
  type AssignmentDetail,
  type AssignmentSubmissionStatus,
} from "./assignmentsApi";

interface AssignmentDetailDialogProps {
  classId: number;
  assignment: Assignment | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (assignment: Assignment) => void;
  onDeleted: (assignmentId: number) => void;
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// Cloudinary lets you request a resized/optimized delivery of the same asset
// by inserting transform params right after "/upload/" in the URL.
function cloudinaryThumbnail(url: string): string {
  return url.replace("/upload/", "/upload/w_120,h_120,c_fill,q_auto,f_auto/");
}

function AssignmentDetailDialog({
  classId,
  assignment,
  onOpenChange,
  onEdit,
  onDeleted,
}: AssignmentDetailDialogProps) {
  const { t } = useTranslation(["teacher", "common"]);
  const [detail, setDetail] = useState<AssignmentDetail | null>(null);
  const [loadedId, setLoadedId] = useState<number | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [savingStudentId, setSavingStudentId] = useState<number | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>({});
  const [zoomedRow, setZoomedRow] = useState<{ url: string; fullName: string } | null>(null);
  const detailRef = useRef<AssignmentDetail | null>(null);

  const isLoading = assignment !== null && loadedId !== assignment.id;

  useEffect(() => {
    detailRef.current = detail;
  }, [detail]);

  useEffect(() => {
    if (!assignment) return;
    let cancelled = false;

    fetchAssignmentDetail(classId, assignment.id)
      .then((d) => {
        if (cancelled) return;
        setDetail(d);
        setLoadedId(assignment.id);
        setNoteDrafts(Object.fromEntries(d.students.map((s) => [s.studentId, s.note ?? ""])));
      })
      .catch(() => {
        if (cancelled) return;
        setLoadedId(assignment.id);
        toast.error(t("teacher:assignments.detail.loadError"));
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignment?.id, classId]);

  useEffect(() => {
    if (!assignment) return;
    const assignmentId = assignment.id;

    return onAppEvent((scope) => {
      if (scope !== "assignment") return;
      fetchAssignmentDetail(classId, assignmentId)
        .then((d) => {
          const prevDetail = detailRef.current;
          // Keep any note the teacher is mid-edit on — only sync drafts that
          // still match what the server last had, so a live refresh can't
          // clobber an unsaved edit.
          setNoteDrafts((prevDrafts) => {
            const next = { ...prevDrafts };
            for (const row of d.students) {
              const previousServerNote =
                prevDetail?.students.find((s) => s.studentId === row.studentId)?.note ?? "";
              if ((prevDrafts[row.studentId] ?? "") === previousServerNote) {
                next[row.studentId] = row.note ?? "";
              }
            }
            return next;
          });
          setDetail(d);
        })
        .catch(() => {});
    });
  }, [assignment?.id, classId]);

  async function persist(studentId: number, status: AssignmentSubmissionStatus, note: string) {
    if (!assignment) return;
    setSavingStudentId(studentId);
    try {
      const updated = await updateSubmissionStatus(classId, assignment.id, studentId, status, note);
      setDetail(updated);
      setNoteDrafts(Object.fromEntries(updated.students.map((s) => [s.studentId, s.note ?? ""])));
    } catch {
      toast.error(t("teacher:assignments.detail.updateStatusError"));
    } finally {
      setSavingStudentId(null);
    }
  }

  function handleStatusChange(studentId: number, status: AssignmentSubmissionStatus) {
    persist(studentId, status, noteDrafts[studentId] ?? "");
  }

  function handleNoteBlur(studentId: number, currentStatus: AssignmentSubmissionStatus) {
    const original = detail?.students.find((s) => s.studentId === studentId)?.note ?? "";
    const draft = noteDrafts[studentId] ?? "";
    if (draft === original) return;
    persist(studentId, currentStatus, draft);
  }

  async function confirmDelete() {
    if (!assignment) return;
    setIsDeleting(true);
    try {
      await deleteAssignment(classId, assignment.id);
      onDeleted(assignment.id);
      setIsDeleteOpen(false);
      onOpenChange(false);
      toast.success(t("teacher:assignments.deleteSuccess"));
    } catch {
      toast.error(t("teacher:assignments.deleteError"));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Dialog open={assignment !== null} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{assignment?.title}</DialogTitle>
          </DialogHeader>

          {isLoading || !detail ? (
            <p className="text-sm text-muted-foreground">{t("common:status.loading")}</p>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {detail.content && <p className="text-sm whitespace-pre-wrap text-foreground">{detail.content}</p>}
                {detail.dueDate && (
                  <p className="text-xs text-muted-foreground">
                    {t("teacher:assignments.detail.dueDate", { date: formatDate(detail.dueDate) })}
                  </p>
                )}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => assignment && onEdit(assignment)}
                  >
                    {t("common:actions.edit")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setIsDeleteOpen(true)}
                  >
                    {t("common:actions.delete")}
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-foreground">
                  {t("teacher:assignments.detail.studentsTitle", { count: detail.students.length })}
                </h3>
                <ul className="flex flex-col gap-2">
                  {detail.students.map((row) => (
                    <li
                      key={row.studentId}
                      className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        {row.fileUrl && (
                          <button
                            type="button"
                            onClick={() => setZoomedRow({ url: row.fileUrl!, fullName: row.fullName })}
                            className="shrink-0 overflow-hidden rounded-lg border border-border transition-opacity hover:opacity-80"
                          >
                            <img
                              src={cloudinaryThumbnail(row.fileUrl)}
                              alt={t("teacher:assignments.detail.viewFile")}
                              className="h-14 w-14 object-cover"
                            />
                          </button>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{row.fullName}</p>
                          {row.submittedAt && (
                            <p className="text-xs text-muted-foreground">
                              {t("teacher:assignments.detail.submittedAt", {
                                date: new Date(row.submittedAt).toLocaleString("vi-VN"),
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          value={noteDrafts[row.studentId] ?? ""}
                          onChange={(e) =>
                            setNoteDrafts((prev) => ({ ...prev, [row.studentId]: e.target.value }))
                          }
                          onBlur={() => handleNoteBlur(row.studentId, row.status)}
                          placeholder={t("teacher:assignments.detail.notePlaceholder")}
                          className="w-40"
                          disabled={savingStudentId === row.studentId}
                        />
                        <Select
                          value={row.status}
                          onValueChange={(v) => handleStatusChange(row.studentId, v as AssignmentSubmissionStatus)}
                        >
                          <SelectTrigger className="w-32" disabled={savingStudentId === row.studentId}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">{t("teacher:assignments.status.PENDING")}</SelectItem>
                            <SelectItem value="SUBMITTED">{t("teacher:assignments.status.SUBMITTED")}</SelectItem>
                            <SelectItem value="GRADED">{t("teacher:assignments.status.GRADED")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={zoomedRow !== null} onOpenChange={(open) => !open && setZoomedRow(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{zoomedRow?.fullName}</DialogTitle>
          </DialogHeader>
          {zoomedRow && (
            <div className="flex flex-col items-center gap-3">
              <img src={zoomedRow.url} alt="" className="h-auto w-full rounded-lg" />
              <a
                href={zoomedRow.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-brand-dark underline-offset-4 hover:underline"
              >
                {t("teacher:assignments.detail.openOriginal")}
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={t("teacher:assignments.deleteDialog.title")}
        description={assignment ? t("teacher:assignments.deleteConfirm", { title: assignment.title }) : undefined}
        confirmLabel={t("common:actions.delete")}
        variant="destructive"
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
      />
    </>
  );
}

export default AssignmentDetailDialog;
