import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { displayMonth } from "@/pages/teacher/attendanceOptions";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

interface Period {
  year: number;
  month: number;
}

interface MonthYearPickerProps {
  year: number;
  month: number;
  onChange: (period: Period) => void;
}

function MonthYearPicker({ year, month, onChange }: MonthYearPickerProps) {
  const { t } = useTranslation("common");

  function changeMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    onChange({ year: y, month: m });
  }

  const nowYear = new Date().getFullYear();
  const start = Math.min(nowYear - 3, year);
  const end = Math.max(nowYear + 3, year);
  const yearOptions = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="bg-transparent"
        onClick={() => changeMonth(-1)}
      >
        ‹
      </Button>
      <Select value={String(month)} onValueChange={(v) => onChange({ year, month: Number(v) })}>
        <SelectTrigger className="w-[130px]" aria-label={t("selectMonth")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((m) => (
            <SelectItem key={m} value={String(m)}>
              {displayMonth(m, t)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(year)} onValueChange={(v) => onChange({ year: Number(v), month })}>
        <SelectTrigger className="w-[90px]" aria-label={t("selectYear")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {yearOptions.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="bg-transparent"
        onClick={() => changeMonth(1)}
      >
        ›
      </Button>
    </div>
  );
}

export default MonthYearPicker;
