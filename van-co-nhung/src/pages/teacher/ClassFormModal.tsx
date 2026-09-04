import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
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
import RequiredMark from "@/components/RequiredMark";
import { createClass, type ClassSummary, type ScheduleSlotInput } from "./classesApi";
import { displayGrade, GRADE_OPTIONS } from "./gradeOptions";
import ScheduleSlotEditor from "./ScheduleSlotEditor";

interface ClassFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (classRoom: ClassSummary) => void;
}

function ClassFormModal({ open, onOpenChange, onCreated }: ClassFormModalProps) {
  const { t } = useTranslation(["teacher", "common"]);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [schedules, setSchedules] = useState<ScheduleSlotInput[]>([]);
  const [note, setNote] = useState("");
  const [feePerSession, setFeePerSession] = useState("60000");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setName("");
    setGrade("");
    setSchedules([]);
    setNote("");
    setFeePerSession("60000");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error(t("teacher:classForm.nameRequiredError"));
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createClass({
        name: name.trim(),
        grade,
        schedules,
        note: note.trim(),
        feePerSession: feePerSession.trim() ? Number(feePerSession) : null,
      });
      onCreated(created);
      resetForm();
    } catch {
      toast.error(t("teacher:classForm.createError"));
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
          <DialogTitle>{t("teacher:classForm.createTitle")}</DialogTitle>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="c-name">
              {t("teacher:classForm.fields.name")}
              <RequiredMark />
            </Label>
            <Input
              id="c-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="c-grade">{t("teacher:classForm.fields.grade")}</Label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger id="c-grade" className="w-full" disabled={isSubmitting}>
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
            <Label htmlFor="c-fee-per-session">{t("teacher:classForm.fields.feePerSession")}</Label>
            <Input
              id="c-fee-per-session"
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
            <Label htmlFor="c-note">{t("teacher:classForm.fields.note")}</Label>
            <Textarea
              id="c-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? t("teacher:classForm.submitting") : t("teacher:classForm.submit")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ClassFormModal;
