import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ScheduleSlotInput } from "./classesApi";
import { DAY_OF_WEEK_OPTIONS, displayDayOfWeek, formatScheduleSlot } from "./scheduleOptions";

interface ScheduleSlotEditorProps {
  slots: ScheduleSlotInput[];
  onChange: (slots: ScheduleSlotInput[]) => void;
  disabled?: boolean;
}

function ScheduleSlotEditor({ slots, onChange, disabled }: ScheduleSlotEditorProps) {
  const { t } = useTranslation(["teacher", "common"]);
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  function handleAdd() {
    if (!dayOfWeek || !startTime || !endTime) return;
    if (endTime <= startTime) return;

    onChange([...slots, { dayOfWeek, startTime, endTime }]);
    setDayOfWeek("");
    setStartTime("");
    setEndTime("");
  }

  function handleRemove(index: number) {
    onChange(slots.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>{t("teacher:schedule.label")}</Label>

      {slots.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {slots.map((slot, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-1.5 text-sm"
            >
              <span>{formatScheduleSlot(slot, t)}</span>
              <button
                type="button"
                className="text-xs font-semibold text-destructive underline-offset-4 hover:underline"
                onClick={() => handleRemove(i)}
                disabled={disabled}
              >
                {t("common:actions.delete")}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-[1fr_1fr_auto_auto] items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="slot-day" className="text-xs font-normal text-muted-foreground">
            {t("teacher:schedule.dayLabel")}
          </Label>
          <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
            <SelectTrigger id="slot-day" className="w-full" disabled={disabled}>
              <SelectValue placeholder={t("teacher:schedule.dayPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {DAY_OF_WEEK_OPTIONS.map((d) => (
                <SelectItem key={d} value={d}>
                  {displayDayOfWeek(d, t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="slot-start-time" className="text-xs font-normal text-muted-foreground">
            {t("teacher:schedule.startTimeLabel")}
          </Label>
          <Input
            id="slot-start-time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="slot-end-time" className="text-xs font-normal text-muted-foreground">
            {t("teacher:schedule.endTimeLabel")}
          </Label>
          <Input
            id="slot-end-time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            disabled={disabled}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleAdd}
          disabled={disabled || !dayOfWeek || !startTime || !endTime || endTime <= startTime}
        >
          {t("common:actions.add")}
        </Button>
      </div>
    </div>
  );
}

export default ScheduleSlotEditor;
