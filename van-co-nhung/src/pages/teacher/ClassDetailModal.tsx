import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import RequiredMark from "@/components/RequiredMark";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchClassDetail,
  removeStudentFromClass,
  updateClass,
  type ClassDetail,
  type ClassSummary,
  type ScheduleSlotInput,
} from "./classesApi";
import AddStudentDialog from "./AddStudentDialog";
import { displayGrade, GRADE_OPTIONS } from "./gradeOptions";
import ScheduleSlotEditor from "./ScheduleSlotEditor";
import { formatScheduleSlot, sortSchedules } from "./scheduleOptions";

interface ClassDetailModalProps {
  classId: number | null;
  onOpenChange: (open: boolean) => void;
  onClassUpdated: (classRoom: ClassSummary) => void;
}

function ClassDetailModal({ classId, onOpenChange, onClassUpdated }: ClassDetailModalProps) {
  const { t } = useTranslation(["teacher", "common"]);
  const [detail, setDetail] = useState<ClassDetail | null>(null);
  const [loadedClassId, setLoadedClassId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);

  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [schedules, setSchedules] = useState<ScheduleSlotInput[]>([]);
  const [note, setNote] = useState("");
  const [feePerSession, setFeePerSession] = useState("");

  const isLoading = classId !== null && loadedClassId !== classId;

  useEffect(() => {
    if (classId === null) return;
    let cancelled = false;

    fetchClassDetail(classId)
      .then((classDetail) => {
        if (cancelled) return;
        setDetail(classDetail);
        setLoadedClassId(classId);
        setIsEditing(false);
        setName(classDetail.name);
        setGrade(classDetail.grade ?? "");
        setSchedules(
          classDetail.schedules.map((s) => ({
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
          })),
        );
        setNote(classDetail.note ?? "");
        setFeePerSession(classDetail.feePerSession != null ? String(classDetail.feePerSession) : "");
      })
      .catch(() => {
        if (cancelled) return;
        setLoadedClassId(classId);
        toast.error(t("teacher:classDetail.loadError"));
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  async function handleSaveInfo(e: FormEvent) {
    e.preventDefault();
    if (!detail) return;
    if (!name.trim()) {
      toast.error(t("teacher:classForm.nameRequiredError"));
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await updateClass(detail.id, {
        name: name.trim(),
        grade,
        schedules,
        note: note.trim(),
        feePerSession: feePerSession.trim() ? Number(feePerSession) : null,
      });
      setDetail((prev) => (prev ? { ...prev, ...updated } : prev));
      onClassUpdated(updated);
      setIsEditing(false);
      toast.success(t("teacher:classDetail.updateSuccess"));
    } catch {
      toast.error(t("teacher:classDetail.updateError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleStudentAdded(updated: ClassDetail) {
    setDetail(updated);
    onClassUpdated({
      id: updated.id,
      name: updated.name,
      grade: updated.grade,
      schedules: updated.schedules,
      note: updated.note,
      feePerSession: updated.feePerSession,
      active: updated.active,
      studentCount: updated.students.length,
    });
  }

  async function handleRemoveStudent(studentId: number) {
    if (!detail) return;
    try {
      const updated = await removeStudentFromClass(detail.id, studentId);
      setDetail(updated);
      onClassUpdated({
        id: updated.id,
        name: updated.name,
        grade: updated.grade,
        schedules: updated.schedules,
        note: updated.note,
        feePerSession: updated.feePerSession,
        active: updated.active,
        studentCount: updated.students.length,
      });
      toast.success(t("teacher:classDetail.removedStudent"));
    } catch {
      toast.error(t("teacher:classDetail.removeStudentError"));
    }
  }

  return (
    <Dialog open={classId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("teacher:classDetail.titleEdit") : t("teacher:classDetail.titleView")}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("common:status.loading")}</p>
        ) : !detail ? (
          <p className="text-sm text-muted-foreground">{t("teacher:classDetail.loadError")}</p>
        ) : isEditing ? (
          <form className="flex flex-col gap-4" onSubmit={handleSaveInfo}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ce-name">
                {t("teacher:classForm.fields.name")}
                <RequiredMark />
              </Label>
              <Input
                id="ce-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ce-grade">{t("teacher:classForm.fields.grade")}</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger id="ce-grade" className="w-full" disabled={isSubmitting}>
                  <SelectValue placeholder={t("teacher:classForm.fields.gradePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_OPTIONS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {displayGrade(g, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ScheduleSlotEditor slots={schedules} onChange={setSchedules} disabled={isSubmitting} />

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ce-fee-per-session">{t("teacher:classForm.fields.feePerSession")}</Label>
              <Input
                id="ce-fee-per-session"
                type="number"
                min={0}
                step={1000}
                value={feePerSession}
                onChange={(e) => setFeePerSession(e.target.value)}
                disabled={isSubmitting}
                placeholder={t("teacher:classForm.fields.feePerSessionPlaceholder")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ce-note">{t("teacher:classForm.fields.note")}</Label>
              <Textarea
                id="ce-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsEditing(false)}
                disabled={isSubmitting}
              >
                {t("common:actions.cancel")}
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? t("common:status.saving") : t("common:actions.save")}
              </Button>
            </div>
          </form>
        ) : (
          <>
            <dl className="flex flex-col gap-4">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  {t("teacher:classDetail.labels.name")}
                </dt>
                <dd className="text-sm font-medium text-foreground">{detail.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  {t("teacher:classDetail.labels.grade")}
                </dt>
                <dd className="text-sm font-medium text-foreground">
                  {detail.grade ? displayGrade(detail.grade, t) : "—"}
                </dd>
              </div>
              <div>
                <dt className="mb-1 text-xs font-medium text-muted-foreground">
                  {t("teacher:classDetail.labels.schedule")}
                </dt>
                {detail.schedules.length === 0 ? (
                  <dd className="text-sm font-medium text-foreground">—</dd>
                ) : (
                  <dd className="flex flex-col gap-1">
                    {sortSchedules(detail.schedules).map((slot) => (
                      <span key={slot.id} className="text-sm font-medium text-foreground">
                        {formatScheduleSlot(slot, t)}
                      </span>
                    ))}
                  </dd>
                )}
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  {t("teacher:classDetail.labels.feePerSession")}
                </dt>
                <dd className="text-sm font-medium text-foreground">
                  {detail.feePerSession != null ? `${detail.feePerSession.toLocaleString("vi-VN")}đ` : "—"}
                </dd>
              </div>
              {detail.note && (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">
                    {t("teacher:classDetail.labels.note")}
                  </dt>
                  <dd className="text-sm text-foreground whitespace-pre-wrap">{detail.note}</dd>
                </div>
              )}
              <div>
                <dt className="mb-1 text-xs font-medium text-muted-foreground">
                  {t("teacher:classDetail.labels.status")}
                </dt>
                <dd>
                  <Badge variant={detail.active ? "default" : "secondary"}>
                    {detail.active ? t("teacher:classStatus.active") : t("teacher:classStatus.inactive")}
                  </Badge>
                </dd>
              </div>
            </dl>

            <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>
              {t("common:actions.edit")}
            </Button>

            <div className="flex flex-col gap-3 border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground">
                {t("teacher:classDetail.studentsTitle", { count: detail.students.length })}
              </h3>

              {detail.students.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("teacher:classDetail.noStudents")}</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {detail.students.map((student) => (
                    <li
                      key={student.id}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{student.fullName}</p>
                        <p className="text-xs text-muted-foreground">{student.username}</p>
                      </div>
                      <button
                        type="button"
                        className="text-sm font-semibold text-destructive underline-offset-4 hover:underline"
                        onClick={() => handleRemoveStudent(student.id)}
                      >
                        {t("common:actions.delete")}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <Button type="button" variant="outline" onClick={() => setIsAddStudentOpen(true)}>
                {t("teacher:classDetail.addStudentLabel")}
              </Button>
            </div>
          </>
        )}
      </DialogContent>

      <AddStudentDialog
        open={isAddStudentOpen}
        classId={detail?.id ?? null}
        onOpenChange={setIsAddStudentOpen}
        onStudentAdded={handleStudentAdded}
      />
    </Dialog>
  );
}

export default ClassDetailModal;
