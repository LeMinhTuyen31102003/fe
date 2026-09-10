import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { displayMonth } from "@/pages/teacher/attendanceOptions";

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

interface DateParts {
  y: number;
  m: number;
  d: number;
}

interface DayCell {
  iso: string;
  day: number;
  inMonth: boolean;
}

function toIso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function parseIso(iso: string): DateParts {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

function getTodayIso(): string {
  const now = new Date();
  return toIso(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  max?: string;
  className?: string;
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
}

function DatePicker({ value, onChange, max, className, placeholder, allowClear, disabled }: DatePickerProps) {
  const { t } = useTranslation("common");
  const hasValue = value !== "";
  const today = parseIso(getTodayIso());
  const { y: valueY, m: valueM, d: valueD } = hasValue ? parseIso(value) : today;
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(valueY);
  const [viewMonth, setViewMonth] = useState(valueM);

  function handleOpenChange(next: boolean) {
    if (next) {
      setViewYear(valueY);
      setViewMonth(valueM);
    }
    setOpen(next);
  }

  function changeMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setViewYear(y);
    setViewMonth(m);
  }

  function select(iso: string) {
    onChange(iso);
    setOpen(false);
  }

  const weeks = useMemo(() => {
    const startWeekday = new Date(viewYear, viewMonth - 1, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: DayCell[] = [];
    for (let i = startWeekday; i > 0; i--) {
      const d = new Date(viewYear, viewMonth - 1, 1 - i);
      cells.push({ iso: toIso(d.getFullYear(), d.getMonth() + 1, d.getDate()), day: d.getDate(), inMonth: false });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ iso: toIso(viewYear, viewMonth, day), day, inMonth: true });
    }
    while (cells.length < 42) {
      const last = cells[cells.length - 1];
      const { y, m, d } = parseIso(last.iso);
      const next = new Date(y, m - 1, d + 1);
      cells.push({
        iso: toIso(next.getFullYear(), next.getMonth() + 1, next.getDate()),
        day: next.getDate(),
        inMonth: false,
      });
    }

    const result: DayCell[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      result.push(cells.slice(i, i + 7));
    }
    return result;
  }, [viewYear, viewMonth]);

  const todayIso = getTodayIso();
  const dayLabel = t(`weekdaysShort.${WEEKDAY_KEYS[new Date(valueY, valueM - 1, valueD).getDay()]}`);
  const displayValue = hasValue
    ? `${dayLabel}, ${String(valueD).padStart(2, "0")}/${String(valueM).padStart(2, "0")}/${valueY}`
    : (placeholder ?? t("selectDate"));

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-[190px] justify-start gap-2 font-normal",
            !hasValue && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="size-4 text-muted-foreground" />
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[276px]">
        <div className="mb-2 flex items-center justify-between">
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => changeMonth(-1)}>
            <ChevronLeftIcon className="size-4" />
          </Button>
          <span className="text-sm font-semibold text-foreground">
            {displayMonth(viewMonth, t)} {viewYear}
          </span>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => changeMonth(1)}>
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7">
          {WEEKDAY_KEYS.map((k) => (
            <div key={k} className="py-1 text-center text-[11px] font-medium text-muted-foreground">
              {t(`weekdaysShort.${k}`)}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {weeks.flat().map((cell) => {
            const isDisabled = max !== undefined && cell.iso > max;
            const isSelected = hasValue && cell.iso === value;
            const isToday = cell.iso === todayIso;
            return (
              <div key={cell.iso} className="flex items-center justify-center">
                <button
                  type="button"
                  disabled={isDisabled}
                  onClick={() => select(cell.iso)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-sm transition-colors",
                    cell.inMonth ? "text-foreground" : "text-muted-foreground/40",
                    !isDisabled && !isSelected && "hover:bg-muted",
                    isDisabled && "cursor-not-allowed opacity-40",
                    isToday && !isSelected && "font-semibold text-primary ring-1 ring-inset ring-primary/50",
                    isSelected && "bg-primary font-semibold text-primary-foreground hover:bg-primary",
                  )}
                >
                  {cell.day}
                </button>
              </div>
            );
          })}
        </div>

        {max !== undefined && value !== max && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            onClick={() => {
              const { y, m } = parseIso(max);
              setViewYear(y);
              setViewMonth(m);
              select(max);
            }}
          >
            {t("today")}
          </Button>
        )}

        {allowClear && hasValue && (
          <Button type="button" variant="ghost" size="sm" className="mt-2 w-full" onClick={() => select("")}>
            {t("actions.clear")}
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default DatePicker;
