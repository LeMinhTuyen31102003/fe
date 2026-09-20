import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Paperclip, Save, Upload, X } from "lucide-react";
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
import { apiUrl } from "./apiClient";
import {
  createAssignment,
  updateAssignment,
  uploadAssignmentAttachment,
  type Assignment,
} from "./assignmentsApi";

interface AttachmentDraft {
  fileUrl: string;
  filePublicId: string;
}

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
  const [dueTime, setDueTime] = useState("");
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(assignment?.title ?? "");
    setContent(assignment?.content ?? "");
    setDueDate(assignment?.dueDate ?? "");
    setDueTime(assignment?.dueTime?.slice(0, 5) ?? "");
    setAttachments(
      (assignment?.attachments ?? []).map((a) => ({ fileUrl: a.fileUrl, filePublicId: a.filePublicId })),
    );
  }, [open, assignment]);

  function handleDueDateChange(next: string) {
    setDueDate(next);
    if (!next) setDueTime("");
  }

  async function handleAttachmentsSelected(files: FileList) {
    setIsUploadingAttachment(true);
    try {
      const uploaded = await Promise.all(
        Array.from(files).map(async (file) => {
          const { url, publicId } = await uploadAssignmentAttachment(classId, file);
          return { fileUrl: url, filePublicId: publicId };
        }),
      );
      setAttachments((prev) => [...prev, ...uploaded]);
    } catch {
      toast.error(t("teacher:assignments.form.attachmentUploadError"));
    } finally {
      setIsUploadingAttachment(false);
    }
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error(t("teacher:assignments.form.titleRequiredError"));
      return;
    }

    setIsSubmitting(true);
    try {
      const input = {
        title: title.trim(),
        content: content.trim(),
        dueDate: dueDate || null,
        dueTime: dueDate && dueTime ? dueTime : null,
        attachments,
      };
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
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
            <div className="flex gap-2">
              <DatePicker
                value={dueDate}
                onChange={handleDueDateChange}
                allowClear
                disabled={isSubmitting}
                className="flex-1"
              />
              <Input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                disabled={isSubmitting || !dueDate}
                className="w-32"
              />
            </div>
            <p className="text-xs text-muted-foreground">{t("teacher:assignments.form.fields.dueTimeHint")}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t("teacher:assignments.form.fields.attachment")}</Label>
            {attachments.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {attachments.map((att, index) => (
                  <li
                    key={att.filePublicId}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
                  >
                    <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <a
                      href={apiUrl(att.fileUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-0 flex-1 truncate text-sm text-brand-dark underline-offset-4 hover:underline"
                    >
                      {t("teacher:assignments.form.attachmentView")}
                      {attachments.length > 1 ? ` ${index + 1}` : ""}
                    </a>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      disabled={isSubmitting || isUploadingAttachment}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <input
              id="af-attachment"
              type="file"
              multiple
              className="hidden"
              disabled={isSubmitting || isUploadingAttachment}
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) void handleAttachmentsSelected(files);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              disabled={isSubmitting || isUploadingAttachment}
              asChild
            >
              <label htmlFor="af-attachment" className="cursor-pointer">
                <Upload />
                {isUploadingAttachment
                  ? t("teacher:assignments.form.attachmentUploading")
                  : t("teacher:assignments.form.attachmentAdd")}
              </label>
            </Button>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              <X />
              {t("common:actions.cancel")}
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting || isUploadingAttachment}>
              <Save />
              {isSubmitting ? t("common:status.saving") : t("common:actions.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AssignmentFormDialog;
