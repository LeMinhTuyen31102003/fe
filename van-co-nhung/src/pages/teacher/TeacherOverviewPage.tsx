import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CalendarClock, CalendarDays, ClipboardCheck, Layers, Users, Wallet } from "lucide-react";
import PageBanner from "@/components/PageBanner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "../../hooks/useAuth";
import { fetchClasses, type ClassSummary } from "./classesApi";
import { fetchStudents } from "./studentsApi";
import { fetchMonthlyAttendance } from "./attendanceApi";
import { fetchMonthlyTuition } from "./tuitionApi";
import { displayTime } from "./scheduleOptions";

const JS_DAY_TO_ENUM = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

function getToday() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    iso: `${y}-${m}-${d}`,
    dayOfWeek: JS_DAY_TO_ENUM[now.getDay()],
  };
}

function formatCurrency(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

interface TodaySession {
  classId: number;
  className: string;
  startTime: string;
  endTime: string;
  markedCount: number;
  totalCount: number;
}

function TeacherOverviewPage() {
  const { userName, fullName } = useAuth();
  const { t } = useTranslation(["teacher", "common"]);
  const navigate = useNavigate();
  const today = useMemo(() => getToday(), []);

  const [classes, setClasses] = useState<ClassSummary[] | null>(null);
  const [studentCount, setStudentCount] = useState(0);
  const [todaySessions, setTodaySessions] = useState<TodaySession[]>([]);
  const [tuitionTotals, setTuitionTotals] = useState<{ collected: number; outstanding: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [classList, students] = await Promise.all([
          fetchClasses(),
          fetchStudents({ status: "active" }),
        ]);
        if (cancelled) return;
        setClasses(classList);
        setStudentCount(students.length);

        const activeClasses = classList.filter((c) => c.active);
        const classesToday = activeClasses.filter((c) =>
          c.schedules.some((s) => s.dayOfWeek === today.dayOfWeek),
        );

        const [attendanceResults, tuitionResults] = await Promise.all([
          Promise.all(
            classesToday.map((c) => fetchMonthlyAttendance(c.id, today.year, today.month).catch(() => null)),
          ),
          Promise.all(
            activeClasses.map((c) => fetchMonthlyTuition(c.id, today.year, today.month).catch(() => null)),
          ),
        ]);
        if (cancelled) return;

        const sessions: TodaySession[] = classesToday.map((c, idx) => {
          const slot = c.schedules.find((s) => s.dayOfWeek === today.dayOfWeek)!;
          const attendance = attendanceResults[idx];
          const markedCount = attendance
            ? attendance.students.filter((s) => s.entries[today.iso]).length
            : 0;
          return {
            classId: c.id,
            className: c.name,
            startTime: slot.startTime,
            endTime: slot.endTime,
            markedCount,
            totalCount: c.studentCount,
          };
        });
        sessions.sort((a, b) => a.startTime.localeCompare(b.startTime));
        setTodaySessions(sessions);

        const totals = tuitionResults.reduce(
          (acc, tuition) => {
            if (!tuition) return acc;
            acc.collected += tuition.summary.totalCollected;
            acc.outstanding += tuition.summary.totalOutstanding;
            return acc;
          },
          { collected: 0, outstanding: 0 },
        );
        setTuitionTotals(totals);
      } catch {
        if (!cancelled) toast.error(t("teacher:overview.loadError"));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeClassCount = classes?.filter((c) => c.active).length ?? 0;
  const weeklySessionCount =
    classes?.filter((c) => c.active).reduce((sum, c) => sum + c.schedules.length, 0) ?? 0;

  const stats = [
    { label: t("teacher:overview.stats.classes"), value: activeClassCount, icon: Layers },
    { label: t("teacher:overview.stats.students"), value: studentCount, icon: Users },
    { label: t("teacher:overview.stats.sessionsThisWeek"), value: weeklySessionCount, icon: CalendarDays },
  ];

  return (
    <>
      <PageBanner
        title={t("teacher:overview.title")}
        subtitle={t("teacher:overview.greeting", { name: fullName || userName })}
        className="mb-6"
      />

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-background p-5">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#6B4423] text-white">
              <stat.icon className="h-4.5 w-4.5" />
            </div>
            <div className="mb-1 text-sm text-muted-foreground">{stat.label}</div>
            <div className="text-3xl font-bold text-foreground">{stat.value}</div>
          </div>
        ))}
      </section>

      <section className="mb-6 rounded-xl border border-border bg-background p-5">
        <h2 className="mb-4 flex items-center gap-2.5 font-heading text-lg font-semibold text-foreground">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#6B4423] text-white">
            <CalendarClock className="h-4 w-4" />
          </span>
          {t("teacher:overview.todaySchedule.title")}
        </h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("common:status.loading")}</p>
        ) : todaySessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("teacher:overview.todaySchedule.empty")}</p>
        ) : (
          <ul className="divide-y divide-border">
            {todaySessions.map((session) => {
              const isComplete = session.totalCount > 0 && session.markedCount >= session.totalCount;
              const isStarted = session.markedCount > 0;
              return (
                <li key={session.classId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <div className="font-medium text-foreground">{session.className}</div>
                    <div className="text-sm text-muted-foreground">
                      {displayTime(session.startTime)} - {displayTime(session.endTime)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={isComplete ? "default" : isStarted ? "secondary" : "outline"}
                      className={isComplete ? "bg-emerald-100 text-emerald-700" : undefined}
                    >
                      {isComplete
                        ? t("teacher:overview.todaySchedule.complete")
                        : t("teacher:overview.todaySchedule.progress", {
                            marked: session.markedCount,
                            total: session.totalCount,
                          })}
                    </Badge>
                    <Button
                      size="sm"
                      className="bg-[#6B4423] text-white hover:bg-[#5A3A1D]"
                      onClick={() => navigate("/admin/attendance")}
                    >
                      <ClipboardCheck />
                      {t("teacher:overview.todaySchedule.markButton")}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-background p-5">
        <h2 className="mb-4 flex items-center gap-2.5 font-heading text-lg font-semibold text-foreground">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#6B4423] text-white">
            <Wallet className="h-4 w-4" />
          </span>
          {t("teacher:overview.tuition.title")}
        </h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("common:status.loading")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="text-sm text-muted-foreground">{t("teacher:overview.tuition.collected")}</div>
              <div className="text-xl font-semibold text-emerald-600">
                {formatCurrency(tuitionTotals?.collected ?? 0)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t("teacher:overview.tuition.outstanding")}</div>
              <div className="text-xl font-semibold text-amber-600">
                {formatCurrency(tuitionTotals?.outstanding ?? 0)}
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

export default TeacherOverviewPage;
