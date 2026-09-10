import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import DatePicker from "@/components/DatePicker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RequiredMark from "@/components/RequiredMark";
import { Textarea } from "@/components/ui/textarea";
import { createAssignment, updateAssignment, type Assignment } from "./assignmentsApi";

interface AssignmentFormDialogProps {
  open: boolean;
  classId: number;
  assignment: Assignment | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (assignment: Assignment) => void;
}

function AssignmentFormDialog({ open, classId, assignment, onOpenChange, onSaved }: AssignmentFormDialogProps) {
  const { t } = useTranslation(["teacher", "common"]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(assignment?.title ?? "");
    setContent(assignment?.content ?? "");
    setDueDate(assignment?.dueDate ?? "");
  }, [open, assignment]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error(t("teacher:assignments.form.titleRequiredError"));
      return;
    }

    setIsSubmitting(true);
    try {
      const input = { title: title.trim(), content: content.trim(), dueDate: dueDate || null };
      const saved = assignment
        ? await updateAssignment(classId, assignment.id, input)
        : await createAssignment(classId, input);
      onSaved(saved);
      onOpenChange(false);
      toast.success(
        assignment ? t("teacher:assignments.form.updateSuccess") : t("teacher:assignments.form.createSuccess"),
      );
    } catch {
      toast.error(
        assignment ? t("teacher:assignments.form.updateError") : t("teacher:assignments.form.createError"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {assignment ? t("teacher:assignments.form.editTitle") : t("teacher:assignments.form.createTitle")}
          </DialogTitle>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="af-title">
              {t("teacher:assignments.form.fields.title")}
              <RequiredMark />
            </Label>
            <Input
              id="af-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="af-content">{t("teacher:assignments.form.fields.content")}</Label>
            <Textarea
              id="af-content"
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
              placeholder={t("teacher:assignments.form.fields.contentPlaceholder")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t("teacher:assignments.form.fields.dueDate")}</Label>
            <DatePicker
              value={dueDate}
              onChange={setDueDate}
              allowClear
              disabled={isSubmitting}
              className="w-full"
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("common:actions.cancel")}
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? t("common:status.saving") : t("common:actions.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AssignmentFormDialog;
