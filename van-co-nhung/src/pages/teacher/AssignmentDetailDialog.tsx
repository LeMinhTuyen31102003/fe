import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Check, ClipboardCheck, Paperclip, Pencil, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ConfirmDialog";
import RequiredMark from "@/components/RequiredMark";
import { apiUrl } from "./apiClient";
import { onAppEvent } from "@/eventStream";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  deleteAssignment,
  fetchAssignmentDetail,
  updateSubmissionFeedback,
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

const STATUS_VARIANT: Record<AssignmentSubmissionStatus, "default" | "secondary" | "outline"> = {
  PENDING: "outline",
  SUBMITTED: "secondary",
  GRADED: "default",
};

// Whole numbers or up to 2 decimal digits — e.g. "8", "8.5", "8.75", not "8.756".
const SCORE_PATTERN = /^\d{1,2}(\.\d{1,2})?$/;

// Keeps the score field a plain text input (never type="number" — see CLAUDE.md:
// native number inputs allow "e"/"-"/scientific notation, use locale-dependent decimal
// separators, and can't be sanitized on the fly) while still steering typed input
// toward the same shape SCORE_PATTERN checks on confirm: digits, at most one dot, at
// most 2 digits after it.
function sanitizeScoreInput(raw: string): string {
  let value = raw.replace(/[^\d.]/g, "");
  const firstDot = value.indexOf(".");
  if (firstDot !== -1) {
    value = value.slice(0, firstDot + 1) + value.slice(firstDot + 1).replace(/\./g, "");
  }
  const [intPart, decPart] = value.split(".");
  const trimmedInt = intPart.slice(0, 2);
  return decPart !== undefined ? `${trimmedInt}.${decPart.slice(0, 2)}` : trimmedInt;
}

function formatDueDate(iso: string, time: string | null) {
  const [y, m, d] = iso.split("-");
  return time ? `${d}/${m}/${y} ${time.slice(0, 5)}` : `${d}/${m}/${y}`;
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
  const [scoreDrafts, setScoreDrafts] = useState<Record<number, string>>({});
  const [zoomedRow, setZoomedRow] = useState<{ url: string; fullName: string } | null>(null);
  const [gradingDialogStudentId, setGradingDialogStudentId] = useState<number | null>(null);
  const detailRef = useRef<AssignmentDetail | null>(null);

  const isLoading = assignment !== null && loadedId !== assignment.id;
  const gradingRow = detail?.students.find((s) => s.studentId === gradingDialogStudentId) ?? null;

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
        setScoreDrafts(Object.fromEntries(d.students.map((s) => [s.studentId, s.score != null ? String(s.score) : ""])));
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
          // Keep any note/score the teacher is mid-edit on — only sync drafts that
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
          setScoreDrafts((prevDrafts) => {
            const next = { ...prevDrafts };
            for (const row of d.students) {
              const prevServerScore = prevDetail?.students.find((s) => s.studentId === row.studentId)?.score;
              const previousServerScoreText = prevServerScore != null ? String(prevServerScore) : "";
              if ((prevDrafts[row.studentId] ?? "") === previousServerScoreText) {
                next[row.studentId] = row.score != null ? String(row.score) : "";
              }
            }
            return next;
          });
          setDetail(d);
        })
        .catch(() => {});
    });
  }, [assignment?.id, classId]);

  async function persist(studentId: number, note: string, score: number | null): Promise<boolean> {
    if (!assignment) return false;
    setSavingStudentId(studentId);
    try {
      const updated = await updateSubmissionFeedback(classId, assignment.id, studentId, note, score);
      setDetail(updated);
      setNoteDrafts(Object.fromEntries(updated.students.map((s) => [s.studentId, s.note ?? ""])));
      setScoreDrafts(
        Object.fromEntries(updated.students.map((s) => [s.studentId, s.score != null ? String(s.score) : ""])),
      );
      return true;
    } catch {
      toast.error(t("teacher:assignments.detail.updateStatusError"));
      return false;
    } finally {
      setSavingStudentId(null);
    }
  }

  function openGradingDialog(studentId: number) {
    setGradingDialogStudentId(studentId);
  }

  function cancelGradingDialog() {
    if (gradingDialogStudentId !== null) {
      const row = detail?.students.find((s) => s.studentId === gradingDialogStudentId);
      setNoteDrafts((prev) => ({ ...prev, [gradingDialogStudentId]: row?.note ?? "" }));
      setScoreDrafts((prev) => ({
        ...prev,
        [gradingDialogStudentId]: row?.score != null ? String(row.score) : "",
      }));
    }
    setGradingDialogStudentId(null);
  }

  async function confirmGradingDialog() {
    if (gradingDialogStudentId === null) return;
    const rawScore = (scoreDrafts[gradingDialogStudentId] ?? "").trim();
    // A score is mandatory to confirm — this button's whole purpose is grading, and a
    // graded submission is what locks the student out of resubmitting (see isLocked()
    // in MeController), so there's no "save note only, leave ungraded" path here anymore.
    if (rawScore === "") {
      toast.error(t("teacher:assignments.detail.scoreRequired"));
      return;
    }
    // Numbers only, at most 2 digits after the decimal point (e.g. 8, 8.5, 8.75 —
    // not 8.756), and only after that is it checked against the 0-10 range.
    if (!SCORE_PATTERN.test(rawScore)) {
      toast.error(t("teacher:assignments.detail.scoreInvalid"));
      return;
    }
    const score = Number(rawScore);
    if (score < 0 || score > 10) {
      toast.error(t("teacher:assignments.detail.scoreInvalid"));
      return;
    }
    const success = await persist(gradingDialogStudentId, noteDrafts[gradingDialogStudentId] ?? "", score);
    if (success) setGradingDialogStudentId(null);
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
                    {t("teacher:assignments.detail.dueDate", { date: formatDueDate(detail.dueDate, detail.dueTime) })}
                  </p>
                )}
                {detail.attachments.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {detail.attachments.map((att, index) => (
                      <a
                        key={att.id ?? att.fileUrl}
                        href={apiUrl(att.fileUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex w-fit items-center gap-1.5 text-sm font-semibold text-brand-dark underline-offset-4 hover:underline"
                      >
                        <Paperclip className="h-4 w-4" />
                        {t("teacher:assignments.detail.viewAttachment")}
                        {detail.attachments.length > 1 ? ` ${index + 1}` : ""}
                      </a>
                    ))}
                  </div>
                )}
                <div className="flex gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => assignment && onEdit(assignment)}
                      >
                        <Pencil />
                        {t("common:actions.edit")}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("teacher:assignments.form.editTitle")}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setIsDeleteOpen(true)}
                      >
                        <Trash2 />
                        {t("common:actions.delete")}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("teacher:assignments.deleteDialog.title")}</TooltipContent>
                  </Tooltip>
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
                              src={apiUrl(row.fileUrl)}
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
                        <Badge variant={STATUS_VARIANT[row.status]}>
                          {t(`teacher:assignments.status.${row.status}`)}
                          {row.score != null && ` · ${row.score}/10`}
                        </Badge>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant={row.score != null ? "secondary" : "outline"}
                              size="sm"
                              onClick={() => openGradingDialog(row.studentId)}
                            >
                              <ClipboardCheck />
                              {row.score != null
                                ? t("teacher:assignments.detail.editGradeButton")
                                : t("teacher:assignments.detail.gradeButton")}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("teacher:assignments.detail.gradeTooltip")}</TooltipContent>
                        </Tooltip>
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
              <img src={apiUrl(zoomedRow.url)} alt="" className="h-auto w-full rounded-lg" />
              <a
                href={apiUrl(zoomedRow.url)}
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

      <Dialog open={gradingDialogStudentId !== null} onOpenChange={(open) => !open && cancelGradingDialog()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {t("teacher:assignments.detail.gradingDialogTitle", {
                name: gradingRow?.fullName ?? "",
              })}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              {gradingRow?.fileUrl && (
                <button
                  type="button"
                  onClick={() => setZoomedRow({ url: gradingRow.fileUrl!, fullName: gradingRow.fullName })}
                  className="shrink-0 overflow-hidden rounded-lg border border-border transition-opacity hover:opacity-80"
                >
                  <img
                    src={apiUrl(gradingRow.fileUrl)}
                    alt={t("teacher:assignments.detail.viewFile")}
                    className="h-28 w-28 object-cover"
                  />
                </button>
              )}
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="grading-score">
                  {t("teacher:assignments.detail.scoreLabel")}
                  <RequiredMark />
                </Label>
                <Input
                  id="grading-score"
                  type="text"
                  inputMode="decimal"
                  value={scoreDrafts[gradingDialogStudentId ?? -1] ?? ""}
                  onChange={(e) => {
                    if (gradingDialogStudentId === null) return;
                    const sanitized = sanitizeScoreInput(e.target.value);
                    setScoreDrafts((prev) => ({ ...prev, [gradingDialogStudentId]: sanitized }));
                  }}
                  placeholder={t("teacher:assignments.detail.scorePlaceholder")}
                  disabled={savingStudentId === gradingDialogStudentId}
                  required
                  className="w-28"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="grading-note">{t("teacher:assignments.detail.noteLabel")}</Label>
              <Textarea
                id="grading-note"
                rows={5}
                value={noteDrafts[gradingDialogStudentId ?? -1] ?? ""}
                onChange={(e) =>
                  gradingDialogStudentId !== null &&
                  setNoteDrafts((prev) => ({ ...prev, [gradingDialogStudentId]: e.target.value }))
                }
                placeholder={t("teacher:assignments.detail.notePlaceholder")}
                disabled={savingStudentId === gradingDialogStudentId}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={cancelGradingDialog}
              disabled={savingStudentId === gradingDialogStudentId}
            >
              <X />
              {t("common:actions.cancel")}
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={confirmGradingDialog}
              disabled={
                savingStudentId === gradingDialogStudentId ||
                (scoreDrafts[gradingDialogStudentId ?? -1] ?? "").trim() === ""
              }
            >
              <Check />
              {savingStudentId === gradingDialogStudentId ? t("common:status.saving") : t("common:actions.confirm")}
            </Button>
          </div>
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
