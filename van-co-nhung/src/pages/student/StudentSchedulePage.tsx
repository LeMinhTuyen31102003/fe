import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import MonthYearPicker from "@/components/MonthYearPicker";
import { cn } from "@/lib/utils";
import { getAttendanceStatusMeta } from "../teacher/attendanceOptions";
import type { AttendanceStatus } from "../teacher/attendanceApi";
import { fetchMyAttendance, type MyClassAttendance } from "./myAttendanceApi";
import { fetchMySchedule, formatTime, type MySchedule } from "./studentApi";

const JS_DAY_TO_ENUM = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const ATTENDANCE_STATUSES: AttendanceStatus[] = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];

interface DayEntry {
  classId: number;
  className: string;
  startTime: string;
  endTime: string;
  status: AttendanceStatus | null;
}

function today() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildMonthGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month - 1, 1);
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7; // 0 = Monday
  const gridStart = new Date(year, month - 1, 1 - firstWeekday);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }

  while (days.length > 35) {
    const lastRow = days.slice(-7);
    if (lastRow.every((d) => d.getMonth() !== month - 1)) {
      days.splice(-7, 7);
    } else {
      break;
    }
  }

  return days;
}

function StudentSchedulePage() {
  const { t } = useTranslation(["student", "common"]);
  const [{ year, month }, setPeriod] = useState(today);
  const [schedule, setSchedule] = useState<MySchedule | null>(null);
  const [attendance, setAttendance] = useState<MyClassAttendance[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const currentKey = `${year}-${month}`;
  const isLoading = loadedKey !== currentKey;

  useEffect(() => {
    fetchMySchedule()
      .then(setSchedule)
      .catch(() => toast.error(t("student:schedule.loadScheduleError")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    const key = `${year}-${month}`;
    fetchMyAttendance(year, month)
      .then((res) => {
        if (cancelled) return;
        setAttendance(res.classes);
        setLoadedKey(key);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadedKey(key);
        toast.error(t("student:schedule.loadAttendanceError"));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const attendanceByKey = useMemo(() => {
    const map = new Map<string, AttendanceStatus>();
    for (const c of attendance) {
      for (const s of c.sessions) {
        map.set(`${c.classId}_${s.date}`, s.status);
      }
    }
    return map;
  }, [attendance]);

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  function entriesFor(date: Date): DayEntry[] {
    const dayName = JS_DAY_TO_ENUM[date.getDay()];
    const dateKey = toDateKey(date);
    const byClassId = new Map<number, DayEntry>();

    // Recurring weekly schedule for this weekday.
    for (const group of schedule?.classes ?? []) {
      for (const slot of group.slots) {
        if (slot.dayOfWeek === dayName) {
          byClassId.set(group.classId, {
            classId: group.classId,
            className: group.className,
            startTime: slot.startTime,
            endTime: slot.endTime,
            status: attendanceByKey.get(`${group.classId}_${dateKey}`) ?? null,
          });
        }
      }
    }

    // Actual attendance records for this exact date — kept even when they fall
    // outside the class's configured weekly schedule (e.g. a make-up session).
    for (const c of attendance) {
      const session = c.sessions.find((s) => s.date === dateKey);
      if (!session) continue;
      const existing = byClassId.get(c.classId);
      if (existing) {
        existing.status = session.status;
      } else {
        byClassId.set(c.classId, {
          classId: c.classId,
          className: c.className,
          startTime: "",
          endTime: "",
          status: session.status,
        });
      }
    }

    return [...byClassId.values()].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  const hasAnyClasses = (schedule?.classes.length ?? 0) > 0 || attendance.length > 0;
  const todayKey = toDateKey(new Date());
  const weekdayHeaders = t("student:schedule.weekdayHeaders", { returnObjects: true }) as string[];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{t("student:schedule.title")}</h1>
          <p className="text-muted-foreground">{t("student:schedule.subtitle")}</p>
        </div>
        <MonthYearPicker year={year} month={month} onChange={setPeriod} />
      </div>

      {!schedule ? (
        <p className="text-sm text-muted-foreground">{t("common:status.loading")}</p>
      ) : !hasAnyClasses ? (
        <p className="text-sm text-muted-foreground">{t("student:schedule.emptyState")}</p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground sm:hidden">{t("student:schedule.mobileHint")}</p>

          <div className="overflow-x-auto rounded-xl border border-border bg-background p-3">
            <div className="grid min-w-[720px] grid-cols-7 gap-2">
              {weekdayHeaders.map((label, index) => (
                <div key={index} className="px-1 pb-1 text-center text-xs font-semibold text-muted-foreground">
                  {label}
                </div>
              ))}

              {grid.map((date) => {
                const dateKey = toDateKey(date);
                const isCurrentMonth = date.getMonth() === month - 1;
                const isToday = dateKey === todayKey;
                const entries = entriesFor(date);

                return (
                  <div
                    key={dateKey}
                    className={cn(
                      "flex min-h-[96px] flex-col gap-1 rounded-lg border border-border p-1.5",
                      !isCurrentMonth && "border-transparent bg-muted/40 opacity-50",
                      isToday && "border-primary ring-1 ring-primary",
                    )}
                  >
                    <span
                      className={cn(
                        "text-xs font-semibold text-foreground",
                        isToday && "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground",
                      )}
                    >
                      {date.getDate()}
                    </span>
                    <div className="flex flex-col gap-1">
                      {entries.map((entry) => {
                        const meta = entry.status ? getAttendanceStatusMeta(t, entry.status) : null;
                        return (
                          <span
                            key={`${entry.classId}-${entry.startTime}`}
                            className={cn(
                              "truncate rounded px-1.5 py-0.5 text-[10px] leading-tight font-semibold",
                              meta ? meta.className : "bg-muted text-muted-foreground",
                            )}
                            title={
                              entry.startTime
                                ? `${entry.className} · ${formatTime(entry.startTime)}–${formatTime(entry.endTime)}`
                                : entry.className
                            }
                          >
                            {entry.className}
                            {entry.startTime ? ` · ${formatTime(entry.startTime)}` : ""}
                            {meta ? ` · ${meta.short}` : ""}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-muted" /> {t("student:schedule.notMarked")}
            </span>
            {ATTENDANCE_STATUSES.map((status) => {
              const meta = getAttendanceStatusMeta(t, status);
              return (
                <span key={status} className="flex items-center gap-1.5">
                  <span className={cn("h-2.5 w-2.5 rounded-full", meta.className.split(" ")[0])} />
                  {meta.label}
                </span>
              );
            })}
          </div>

          {isLoading && <p className="text-xs text-muted-foreground">{t("student:schedule.updatingAttendance")}</p>}
        </>
      )}
    </div>
  );
}

export default StudentSchedulePage;
