import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { CalendarClock, ClipboardCheck, MessageSquare, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import MonthYearPicker from "@/components/MonthYearPicker";
import PageBanner from "@/components/PageBanner";
import Pagination from "@/components/Pagination";
import { cn } from "@/lib/utils";
import { useAuth } from "../../hooks/useAuth";
import { getAttendanceStatusMeta, formatSessionDate } from "../teacher/attendanceOptions";
import { displayTime } from "../teacher/scheduleOptions";
import { fetchMyAttendance, type MyClassAttendance } from "./myAttendanceApi";
import { fetchMyAssignments, type MyAssignment } from "./myAssignmentsApi";
import { fetchMyTuition, type MyClassTuition } from "./myTuitionApi";
import { fetchMySchedule, type MySchedule } from "./studentApi";

const JS_DAY_TO_ENUM = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const SESSIONS_PAGE_SIZE = 4;

function today() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function formatCurrency(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

// Vietnamese given names come last ("Nguyễn Văn An" -> "An") — matches
// initialsFrom's own convention in lib/utils.ts, just not truncated to 1 letter.
function givenNameFrom(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] ?? name;
}

function formatDueDate(iso: string, time: string | null) {
  const [y, m, d] = iso.split("-");
  return time ? `${d}/${m}/${y} ${time.slice(0, 5)}` : `${d}/${m}/${y}`;
}

// Mirrors the backend's own "no time set -> end of day" rule (MeController.dueInstant)
// so the countdown shown here never disagrees with when the server actually locks it.
function dueInstant(dueDate: string, dueTime: string | null): Date {
  const time = dueTime ? dueTime.slice(0, 5) : "23:59";
  return new Date(`${dueDate}T${time}:00`);
}

function formatCountdown(
  due: Date,
  t: TFunction,
): { label: string; variant: "destructive" | "warning" | "neutral" } {
  const diffMs = due.getTime() - Date.now();
  if (diffMs <= 0) return { label: t("student:home.dueSoon.overdue"), variant: "destructive" };
  const hours = diffMs / 3_600_000;
  if (hours < 24) {
    return {
      label: t("student:home.dueSoon.hoursLeft", { count: Math.max(1, Math.ceil(hours)) }),
      variant: "destructive",
    };
  }
  const days = Math.ceil(hours / 24);
  return {
    label: t("student:home.dueSoon.daysLeft", { count: days }),
    variant: days <= 2 ? "warning" : "neutral",
  };
}

const TODO_TILE_CLASSNAME: Record<"warning" | "danger" | "success" | "neutral", string> = {
  warning: "bg-status-warning-bg border-status-warning-fg/30 text-status-warning-fg",
  danger: "bg-status-danger-bg border-status-danger-fg/30 text-status-danger-fg",
  success: "bg-status-success-bg border-status-success-fg/30 text-status-success-fg",
  neutral: "bg-status-neutral-bg border-border text-status-neutral-fg",
};

function TodoTile({
  variant,
  title,
  detail,
  to,
}: {
  variant: "warning" | "danger" | "success" | "neutral";
  title: string;
  detail: string;
  to?: string;
}) {
  const content = (
    <div className={cn("h-full rounded-xl border p-4", TODO_TILE_CLASSNAME[variant])}>
      <div className="mb-1.5 text-sm font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground">{detail}</div>
    </div>
  );
  return to ? (
    <Link to={to} className="block transition-opacity hover:opacity-80">
      {content}
    </Link>
  ) : (
    content
  );
}

const SCORE_BAR_CLASSNAME = (score: number) => {
  if (score >= 8.5) return "bg-brand-brown";
  if (score >= 7) return "bg-brand";
  return "bg-status-neutral-fg/40";
};

function AttendanceCard({
  attendance,
  schedule,
  t,
}: {
  attendance: MyClassAttendance;
  schedule: MySchedule | null;
  t: TFunction;
}) {
  const { className, classId, sessions, summary } = attendance;
  const totalLearned = summary.present + summary.late;
  const totalMarked = summary.present + summary.late + summary.absent + summary.excused;
  const [noteDialog, setNoteDialog] = useState<{ date: string; note: string } | null>(null);
  const [page, setPage] = useState(1);
  // Resets the page during render (React's recommended pattern for "adjust state when a
  // prop changes") rather than an effect — avoids the extra post-commit render a
  // useEffect + setState round trip would cause every time the month changes.
  const [prevAttendance, setPrevAttendance] = useState(attendance);
  if (prevAttendance !== attendance) {
    setPrevAttendance(attendance);
    setPage(1);
  }

  const slots = schedule?.classes.find((c) => c.classId === classId)?.slots ?? [];

  const pct = (count: number) => (totalMarked > 0 ? (count / totalMarked) * 100 : 0);

  const totalPages = Math.max(1, Math.ceil(sessions.length / SESSIONS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageSessions = sessions.slice(
    (currentPage - 1) * SESSIONS_PAGE_SIZE,
    currentPage * SESSIONS_PAGE_SIZE,
  );

  return (
    <div className="rounded-xl border border-border bg-background p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-heading text-lg font-bold text-foreground">{className}</h3>
        <span className="text-sm font-semibold text-foreground">
          {t("student:home.attendanceCard.sessionsLearned", { count: totalLearned })}
        </span>
      </div>

      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("student:home.attendanceCard.noSessions")}</p>
      ) : (
        <>
          {totalMarked > 0 && (
            <div className="mb-3 flex h-2 overflow-hidden rounded-full bg-muted">
              <div className="bg-status-success" style={{ width: `${pct(summary.present)}%` }} />
              <div className="bg-status-warning" style={{ width: `${pct(summary.late)}%` }} />
              <div className="bg-status-danger" style={{ width: `${pct(summary.absent)}%` }} />
              <div className="bg-status-info" style={{ width: `${pct(summary.excused)}%` }} />
            </div>
          )}
          <div className="mb-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-sm bg-status-success" />
              {t("common:attendanceStatus.PRESENT.label")} {summary.present}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-sm bg-status-warning" />
              {t("common:attendanceStatus.LATE.label")} {summary.late}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-sm bg-status-danger" />
              {t("common:attendanceStatus.ABSENT.label")} {summary.absent}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-sm bg-status-info" />
              {t("common:attendanceStatus.EXCUSED.label")} {summary.excused}
            </span>
          </div>

          <ul className="flex flex-col">
            {pageSessions.map((s) => {
              const meta = getAttendanceStatusMeta(t, s.status);
              const { dayLabel, dateLabel } = formatSessionDate(s.date, t);
              const dow = JS_DAY_TO_ENUM[new Date(s.date + "T00:00:00").getDay()];
              const slot = slots.find((sl) => sl.dayOfWeek === dow);
              return (
                <li
                  key={s.date}
                  className="flex items-center gap-3.5 border-b border-border py-2.5 last:border-0"
                >
                  <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg border border-border bg-cream">
                    <span className="font-heading text-sm font-bold text-foreground">
                      {dateLabel.split("/")[0]}
                    </span>
                    <span className="text-[9px] font-medium text-muted-foreground">{dateLabel.split("/")[1]}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-foreground">
                      {dayLabel}
                      {slot && ` · ${displayTime(slot.startTime)} - ${displayTime(slot.endTime)}`}
                    </div>
                    {s.note && (
                      <button
                        type="button"
                        onClick={() => setNoteDialog({ date: dateLabel, note: s.note! })}
                        aria-label={t("student:home.attendanceCard.viewNoteLabel")}
                        className="mt-0.5 inline-flex items-center gap-1 text-xs text-brand-dark hover:underline"
                      >
                        <MessageSquare className="h-3 w-3 shrink-0" fill="currentColor" />
                        {t("student:home.attendanceCard.viewNoteLabel")}
                      </button>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}
                  >
                    {meta.label}
                  </span>
                </li>
              );
            })}
          </ul>
          <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <Dialog open={noteDialog !== null} onOpenChange={(open) => !open && setNoteDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{className}</DialogTitle>
          </DialogHeader>
          {noteDialog && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">{noteDialog.date}</p>
              <p className="text-sm whitespace-pre-wrap text-foreground">{noteDialog.note}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StudentHomePage() {
  const { t, i18n } = useTranslation(["student", "common"]);
  const { fullName, userName } = useAuth();
  const [{ year, month }, setPeriod] = useState(today);
  const [attendance, setAttendance] = useState<MyClassAttendance[]>([]);
  const [assignments, setAssignments] = useState<MyAssignment[]>([]);
  const [tuition, setTuition] = useState<MyClassTuition[]>([]);
  const [schedule, setSchedule] = useState<MySchedule | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [isLoadingExtras, setIsLoadingExtras] = useState(true);

  const currentKey = `${year}-${month}`;
  const isLoading = loadedKey !== currentKey;

  useEffect(() => {
    let cancelled = false;
    const key = `${year}-${month}`;

    Promise.all([fetchMyAttendance(year, month), fetchMyTuition(year, month)])
      .then(([attendanceRes, tuitionRes]) => {
        if (cancelled) return;
        setAttendance(attendanceRes.classes);
        setTuition(tuitionRes.classes);
        setLoadedKey(key);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadedKey(key);
        toast.error(t("student:home.loadError"));
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchMyAssignments(), fetchMySchedule()])
      .then(([assignmentsRes, scheduleRes]) => {
        if (cancelled) return;
        setAssignments(assignmentsRes);
        setSchedule(scheduleRes);
      })
      .catch(() => {
        if (!cancelled) toast.error(t("student:home.loadError"));
      })
      .finally(() => {
        if (!cancelled) setIsLoadingExtras(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const greeting = useMemo(() => {
    const now = new Date();
    const weekday = t(`student:days.${JS_DAY_TO_ENUM[now.getDay()]}`);
    const date = now.toLocaleDateString(i18n.language === "en" ? "en-US" : "vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
    return t("student:home.greeting", { name: givenNameFrom(fullName || userName || ""), weekday, date });
  }, [t, i18n.language, fullName, userName]);

  const pendingAssignments = useMemo(
    () => assignments.filter((a) => a.status === "PENDING" && !a.locked),
    [assignments],
  );
  // An assignment with no dueDate still needs submitting, so it counts as pending — it
  // just sorts after every dated one and never shows up in the "due soon" list.
  const nearestPending = useMemo(
    () =>
      [...pendingAssignments].sort((a, b) => {
        if (!a.dueDate || !b.dueDate) return a.dueDate ? -1 : b.dueDate ? 1 : 0;
        const da = dueInstant(a.dueDate, a.dueTime).getTime();
        const db = dueInstant(b.dueDate, b.dueTime).getTime();
        return da - db;
      })[0] ?? null,
    [pendingAssignments],
  );

  const dueSoon = useMemo(
    () =>
      pendingAssignments
        .filter((a) => a.dueDate)
        .sort((a, b) => dueInstant(a.dueDate!, a.dueTime).getTime() - dueInstant(b.dueDate!, b.dueTime).getTime())
        .slice(0, 4),
    [pendingAssignments],
  );

  const gradedSorted = useMemo(
    () =>
      assignments
        .filter((a): a is MyAssignment & { score: number } => a.score != null)
        .sort((a, b) => {
          const da = a.submittedAt ?? a.createdAt;
          const db = b.submittedAt ?? b.createdAt;
          return da < db ? 1 : -1;
        }),
    [assignments],
  );
  const recentScores = useMemo(() => [...gradedSorted.slice(0, 6)].reverse(), [gradedSorted]);
  const avgRecent = useMemo(() => {
    const top3 = gradedSorted.slice(0, 3);
    if (top3.length === 0) return null;
    return top3.reduce((sum, a) => sum + a.score, 0) / top3.length;
  }, [gradedSorted]);
  const scoreTrend = useMemo(() => {
    const now = new Date();
    const thisMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = `${lastMonthDate.getFullYear()}-${lastMonthDate.getMonth()}`;
    const monthKeyOf = (iso: string) => {
      const d = new Date(iso);
      return `${d.getFullYear()}-${d.getMonth()}`;
    };
    const thisMonthScores = gradedSorted.filter((a) => monthKeyOf(a.submittedAt ?? a.createdAt) === thisMonthKey);
    const lastMonthScores = gradedSorted.filter((a) => monthKeyOf(a.submittedAt ?? a.createdAt) === lastMonthKey);
    if (thisMonthScores.length === 0 || lastMonthScores.length === 0) return null;
    const avg = (list: typeof thisMonthScores) => list.reduce((s, a) => s + a.score, 0) / list.length;
    const diff = avg(thisMonthScores) - avg(lastMonthScores);
    return diff;
  }, [gradedSorted]);

  const unpaidTuition = tuition.find((c) => c.status === "UNPAID" && c.totalAmount > 0) ?? null;
  const pendingTuition = tuition.find((c) => c.status === "PENDING") ?? null;
  const hasBilledTuition = tuition.some((c) => c.totalAmount > 0);

  const todaySession = useMemo(() => {
    if (!schedule) return null;
    const dow = JS_DAY_TO_ENUM[new Date().getDay()];
    const candidates = schedule.classes.flatMap((c) =>
      c.slots.filter((s) => s.dayOfWeek === dow).map((s) => ({ ...s, className: c.className })),
    );
    candidates.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return candidates[0] ?? null;
  }, [schedule]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageBanner title={greeting} subtitle={t("student:home.subtitle")} />

      <section className="rounded-xl border border-border bg-background p-5">
        <h2 className="mb-3.5 flex items-center gap-2 text-xs font-semibold tracking-wide text-status-warning-fg uppercase">
          <ClipboardCheck className="h-3.5 w-3.5" />
          {t("student:home.todo.title")}
        </h2>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {nearestPending ? (
            <TodoTile
              variant="warning"
              title={t("student:home.todo.assignmentsPending", { count: pendingAssignments.length })}
              detail={
                nearestPending.dueDate
                  ? t("student:home.todo.assignmentsPendingDue", {
                      when: formatDueDate(nearestPending.dueDate, nearestPending.dueTime),
                    })
                  : ""
              }
              to="/student/assignments"
            />
          ) : (
            <TodoTile
              variant="success"
              title={t("student:home.todo.assignmentsNone")}
              detail=""
              to="/student/assignments"
            />
          )}

          {unpaidTuition ? (
            <TodoTile
              variant="danger"
              title={t("student:home.todo.tuitionUnpaid", { month })}
              detail={t("student:home.todo.tuitionUnpaidDetail", { amount: formatCurrency(unpaidTuition.totalAmount) })}
              to="/student/tuition"
            />
          ) : pendingTuition ? (
            <TodoTile
              variant="neutral"
              title={t("student:home.todo.tuitionPending")}
              detail={pendingTuition.className}
              to="/student/tuition"
            />
          ) : hasBilledTuition ? (
            <TodoTile variant="success" title={t("student:home.todo.tuitionPaid", { month })} detail="" to="/student/tuition" />
          ) : (
            <TodoTile variant="neutral" title={t("student:home.todo.tuitionNone")} detail="" to="/student/tuition" />
          )}

          {todaySession ? (
            <TodoTile
              variant="success"
              title={t("student:home.todo.tonightSession", {
                when: `${displayTime(todaySession.startTime)} - ${displayTime(todaySession.endTime)}`,
              })}
              detail={t("student:home.todo.tonightSessionDetail", { className: todaySession.className })}
              to="/student/schedule"
            />
          ) : (
            <TodoTile variant="neutral" title={t("student:home.todo.noSessionToday")} detail="" to="/student/schedule" />
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {!isLoading && attendance.length > 0 && (
              <h2 className="font-heading text-lg font-bold text-foreground">{t("student:home.attendanceSection")}</h2>
            )}
            <div className="ml-auto">
              <MonthYearPicker year={year} month={month} onChange={setPeriod} />
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">{t("common:status.loading")}</p>
          ) : attendance.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("student:home.emptyState")}</p>
          ) : (
            attendance.map((a) => (
              <AttendanceCard key={a.classId} attendance={a} schedule={schedule} t={t} />
            ))
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-background p-5">
            <h2 className="mb-3.5 flex items-center gap-2 font-heading text-base font-bold text-foreground">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              {t("student:home.dueSoon.title")}
            </h2>
            {isLoadingExtras ? (
              <p className="text-xs text-muted-foreground">{t("common:status.loading")}</p>
            ) : dueSoon.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("student:home.dueSoon.empty")}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {dueSoon.map((a) => {
                  const countdown = formatCountdown(dueInstant(a.dueDate!, a.dueTime), t);
                  return (
                    <li key={a.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                      <p className="mb-1 truncate text-sm font-medium text-foreground">{a.title}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={countdown.variant}>{countdown.label}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDueDate(a.dueDate!, a.dueTime)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-border bg-background p-5">
            <h2 className="mb-1 flex items-center gap-2 font-heading text-base font-bold text-foreground">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              {t("student:home.scores.title")}
            </h2>
            {isLoadingExtras ? (
              <p className="text-xs text-muted-foreground">{t("common:status.loading")}</p>
            ) : avgRecent === null ? (
              <p className="mt-3 text-xs text-muted-foreground">{t("student:home.scores.empty")}</p>
            ) : (
              <>
                <p className="mb-3 text-xs text-muted-foreground">
                  {t("student:home.scores.subtitle", { count: Math.min(3, gradedSorted.length) })}
                </p>
                <div className="mb-4 flex flex-wrap items-end gap-3">
                  <span className="font-heading text-4xl font-bold text-brand-brown">
                    {avgRecent.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}
                  </span>
                  {scoreTrend !== null && (
                    <span
                      className={cn(
                        "text-sm font-medium",
                        scoreTrend > 0
                          ? "text-status-success-fg"
                          : scoreTrend < 0
                            ? "text-status-danger-fg"
                            : "text-muted-foreground",
                      )}
                    >
                      {scoreTrend > 0
                        ? t("student:home.scores.trendUp", { diff: scoreTrend.toFixed(1) })
                        : scoreTrend < 0
                          ? t("student:home.scores.trendDown", { diff: Math.abs(scoreTrend).toFixed(1) })
                          : t("student:home.scores.trendFlat")}
                    </span>
                  )}
                </div>
                {recentScores.length > 0 && (
                  <div className="flex h-16 items-end gap-2">
                    {recentScores.map((a) => (
                      <div key={a.id} className="flex flex-1 flex-col items-center gap-1.5" title={a.title}>
                        <div
                          className={cn("w-full rounded-t", SCORE_BAR_CLASSNAME(a.score))}
                          style={{ height: `${Math.max(6, (a.score / 10) * 100)}%` }}
                        />
                        <span className="text-[10px] font-medium text-muted-foreground">{a.score}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentHomePage;
