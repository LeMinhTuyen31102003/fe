import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import RequiredMark from "@/components/RequiredMark";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ConfirmDialog";
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
import { removeStudentFromClass } from "./classesApi";
import AddClassDialog from "./AddClassDialog";
import { displayGrade, GRADE_OPTIONS } from "./gradeOptions";
import { updateStudent, type Student } from "./studentsApi";

interface StudentDetailModalProps {
  student: Student | null;
  onOpenChange: (open: boolean) => void;
  onUpdated: (student: Student) => void;
}

function StudentDetailModal({ student, onOpenChange, onUpdated }: StudentDetailModalProps) {
  const { t } = useTranslation(["teacher", "common"]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fullName, setFullName] = useState(student?.fullName ?? "");
  const [email, setEmail] = useState(student?.email ?? "");
  const [grade, setGrade] = useState(student?.grade ?? "");
  const [schoolName, setSchoolName] = useState(student?.schoolName ?? "");
  const [parentName, setParentName] = useState(student?.parentName ?? "");
  const [parentPhone, setParentPhone] = useState(student?.parentPhone ?? "");

  const [isClassBusy, setIsClassBusy] = useState(false);
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [removingClass, setRemovingClass] = useState<{ id: number; name: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!student) return;

    if (!fullName.trim()) {
      toast.error(t("teacher:studentDetail.requiredNameError"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error(t("teacher:studentDetail.invalidEmail"));
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await updateStudent(student.id, {
        fullName: fullName.trim(),
        email: email.trim(),
        grade,
        schoolName: schoolName.trim(),
        parentName: parentName.trim(),
        parentPhone: parentPhone.trim(),
      });
      onUpdated({ ...updated, classes: student.classes });
      setIsEditing(false);
      toast.success(t("teacher:studentDetail.updateSuccess"));
    } catch {
      toast.error(t("teacher:studentDetail.updateError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmRemoveClass() {
    if (!student || !removingClass) return;
    setIsClassBusy(true);
    try {
      await removeStudentFromClass(removingClass.id, student.id);
      onUpdated({ ...student, classes: student.classes.filter((c) => c.id !== removingClass.id) });
      setRemovingClass(null);
      toast.success(t("teacher:studentDetail.removedFromClass"));
    } catch {
      toast.error(t("teacher:studentDetail.removeFromClassError"));
    } finally {
      setIsClassBusy(false);
    }
  }

  return (
    <Dialog open={student !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("teacher:studentDetail.titleEdit") : t("teacher:studentDetail.titleView")}
          </DialogTitle>
        </DialogHeader>

        {student && !isEditing && (
          <>
            <dl className="flex flex-col gap-4">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  {t("teacher:studentDetail.labelFullName")}
                </dt>
                <dd className="text-sm font-medium text-foreground">{student.fullName}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  {t("teacher:studentFields.username")}
                </dt>
                <dd className="text-sm font-medium text-foreground">{student.username}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  {t("teacher:studentFields.email")}
                </dt>
                <dd className="text-sm font-medium text-foreground">{student.email || "—"}</dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">
                    {t("teacher:studentFields.grade")}
                  </dt>
                  <dd className="text-sm font-medium text-foreground">
                    {student.grade ? displayGrade(student.grade, t) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">
                    {t("teacher:studentFields.school")}
                  </dt>
                  <dd className="text-sm font-medium text-foreground">
                    {student.schoolName || "—"}
                  </dd>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">
                    {t("teacher:studentFields.parentName")}
                  </dt>
                  <dd className="text-sm font-medium text-foreground">
                    {student.parentName || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">
                    {t("teacher:studentFields.parentPhone")}
                  </dt>
                  <dd className="text-sm font-medium text-foreground">
                    {student.parentPhone || "—"}
                  </dd>
                </div>
              </div>
              <div>
                <dt className="mb-1 text-xs font-medium text-muted-foreground">
                  {t("teacher:studentDetail.labelStatus")}
                </dt>
                <dd>
                  <Badge variant={student.active ? "default" : "secondary"}>
                    {student.active ? t("teacher:studentStatus.active") : t("teacher:studentStatus.inactive")}
                  </Badge>
                </dd>
              </div>
            </dl>

            <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>
              {t("common:actions.edit")}
            </Button>

            <div className="flex flex-col gap-3 border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground">
                {t("teacher:studentDetail.classesTitle")}
              </h3>

              {student.classes.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("teacher:studentDetail.noClasses")}</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {student.classes.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                    >
                      <span className="text-sm font-medium text-foreground">{c.name}</span>
                      <button
                        type="button"
                        className="text-sm font-semibold text-destructive underline-offset-4 hover:underline"
                        onClick={() => setRemovingClass({ id: c.id, name: c.name })}
                        disabled={isClassBusy}
                      >
                        {t("common:actions.delete")}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddClassOpen(true)}
                disabled={isClassBusy}
              >
                {t("teacher:studentDetail.addClassLabel")}
              </Button>
            </div>
          </>
        )}

        {student && isEditing && (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="d-fullname">
                {t("teacher:studentFields.fullName")}
                <RequiredMark />
              </Label>
              <Input
                id="d-fullname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="d-email">
                {t("teacher:studentFields.email")}
                <RequiredMark />
              </Label>
              <Input
                id="d-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                placeholder="hocsinh@gmail.com"
              />
              <p className="text-xs text-muted-foreground">{t("teacher:studentDetail.emailHint")}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="d-grade">{t("teacher:studentFields.grade")}</Label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger id="d-grade" className="w-full" disabled={isSubmitting}>
                    <SelectValue placeholder={t("teacher:studentFields.gradePlaceholder")} />
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
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="d-school">{t("teacher:studentFields.school")}</Label>
                <Input
                  id="d-school"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="d-parent-name">{t("teacher:studentFields.parentName")}</Label>
                <Input
                  id="d-parent-name"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="d-parent-phone">{t("teacher:studentFields.parentPhone")}</Label>
                <Input
                  id="d-parent-phone"
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
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
        )}
      </DialogContent>

      <AddClassDialog
        open={isAddClassOpen}
        student={student}
        onOpenChange={setIsAddClassOpen}
        onStudentUpdated={onUpdated}
      />

      <ConfirmDialog
        open={removingClass !== null}
        onOpenChange={(open) => !open && setRemovingClass(null)}
        title={t("teacher:studentDetail.removeClassDialog.title")}
        description={
          removingClass ? t("teacher:studentDetail.removeClassConfirm", { name: removingClass.name }) : undefined
        }
        confirmLabel={t("common:actions.delete")}
        variant="destructive"
        isConfirming={isClassBusy}
        onConfirm={confirmRemoveClass}
      />
    </Dialog>
  );
}

export default StudentDetailModal;
