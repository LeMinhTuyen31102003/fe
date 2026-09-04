import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import RequiredMark from "@/components/RequiredMark";
import { addStudentToClass, ClassConflictError, type ClassSummary } from "./classesApi";
import ClassPickerDialog from "./ClassPickerDialog";
import { displayGrade, GRADE_OPTIONS } from "./gradeOptions";
import { createStudent } from "./studentsApi";

interface StudentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

function StudentFormModal({ open, onOpenChange, onCreated }: StudentFormModalProps) {
  const { t } = useTranslation(["teacher", "common"]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [grade, setGrade] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [activateNow, setActivateNow] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedClass, setSelectedClass] = useState<ClassSummary | null>(null);
  const [isClassPickerOpen, setIsClassPickerOpen] = useState(false);

  function resetForm() {
    setUsername("");
    setPassword("");
    setFullName("");
    setGrade("");
    setSchoolName("");
    setParentName("");
    setParentPhone("");
    setActivateNow(false);
    setSelectedClass(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!username.trim() || !fullName.trim()) {
      toast.error(t("teacher:studentForm.requiredFieldsError"));
      return;
    }
    if (password.length < 6) {
      toast.error(t("teacher:studentForm.passwordTooShort"));
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createStudent({
        username: username.trim(),
        password,
        fullName: fullName.trim(),
        grade,
        schoolName: schoolName.trim(),
        parentName: parentName.trim(),
        parentPhone: parentPhone.trim(),
        active: activateNow,
      });

      if (selectedClass) {
        try {
          await addStudentToClass(selectedClass.id, created.id);
        } catch (err) {
          if (err instanceof ClassConflictError) {
            toast.error(t("teacher:classConflict", { className: err.className }));
          } else {
            toast.error(t("teacher:studentForm.addToClassFailed"));
          }
        }
      }

      onCreated();
      resetForm();
      toast.success(t("teacher:studentForm.createSuccess"));
    } catch (err) {
      if (err instanceof Error && err.message === "DUPLICATE_USERNAME") {
        toast.error(t("teacher:studentForm.duplicateUsername"));
      } else {
        toast.error(t("teacher:studentForm.createError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetForm();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("teacher:studentForm.title")}</DialogTitle>
          <DialogDescription>{t("teacher:studentForm.description")}</DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="s-username">
                {t("teacher:studentFields.username")}
                <RequiredMark />
              </Label>
              <Input
                id="s-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="s-password">
                {t("teacher:studentFields.password")}
                <RequiredMark />
              </Label>
              <Input
                id="s-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="s-fullname">
              {t("teacher:studentFields.fullName")}
              <RequiredMark />
            </Label>
            <Input
              id="s-fullname"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="s-grade">{t("teacher:studentFields.grade")}</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger id="s-grade" className="w-full" disabled={isSubmitting}>
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
              <Label htmlFor="s-school">{t("teacher:studentFields.school")}</Label>
              <Input
                id="s-school"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="s-parent-name">{t("teacher:studentFields.parentName")}</Label>
              <Input
                id="s-parent-name"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="s-parent-phone">{t("teacher:studentFields.parentPhone")}</Label>
              <Input
                id="s-parent-phone"
                type="tel"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t("teacher:studentForm.classesLabel")}</Label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex h-8 flex-1 items-center rounded-md border border-input bg-transparent px-2.5 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setIsClassPickerOpen(true)}
                disabled={isSubmitting}
              >
                {selectedClass ? (
                  selectedClass.name
                ) : (
                  <span className="text-muted-foreground">{t("teacher:studentForm.classPlaceholder")}</span>
                )}
              </button>
              {selectedClass && (
                <button
                  type="button"
                  className="text-sm font-semibold text-destructive underline-offset-4 hover:underline"
                  onClick={() => setSelectedClass(null)}
                  disabled={isSubmitting}
                >
                  {t("common:actions.clear")}
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{t("teacher:studentForm.oneClassHint")}</p>
          </div>

          <Label htmlFor="s-active" className="font-normal">
            <Checkbox
              id="s-active"
              checked={activateNow}
              onCheckedChange={(checked) => setActivateNow(checked === true)}
              disabled={isSubmitting}
            />
            {t("teacher:studentForm.activateNow")}
          </Label>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? t("teacher:studentForm.submitting") : t("teacher:studentForm.submit")}
          </Button>
        </form>
      </DialogContent>

      <ClassPickerDialog
        open={isClassPickerOpen}
        onOpenChange={setIsClassPickerOpen}
        onSelect={setSelectedClass}
      />
    </Dialog>
  );
}

export default StudentFormModal;
