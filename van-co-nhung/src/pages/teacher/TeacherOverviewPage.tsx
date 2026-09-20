import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  AlertCircle,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  Layers,
  PenSquare,
  Users,
  Wallet,
} from "lucide-react";
import PageBanner from "@/components/PageBanner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "../../hooks/useAuth";
import { fetchClasses, type ClassSummary } from "./classesApi";
import { fetchStudents } from "./studentsApi";
import { fetchMonthlyAttendance } from "./attendanceApi";
import { fetchMonthlyTuition } from "./tuitionApi";
import { fetchAssignments } from "./assignmentsApi";
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

interface PendingTuitionItem {
  classId: number;
  className: string;
  studentId: number;
  fullName: string;
  totalAmount: number;
}

interface UngradedAssignmentItem {
  classId: number;
  className: string;
  assignmentId: number;
  title: string;
  ungradedCount: number;
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
  const [pendingTuitionItems, setPendingTuitionItems] = useState<PendingTuitionItem[]>([]);
  const [ungradedAssignmentItems, setUngradedAssignmentItems] = useState<UngradedAssignmentItem[]>([]);
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

        const [attendanceResults, tuitionResults, assignmentsResults] = await Promise.all([
          Promise.all(
            classesToday.map((c) => fetchMonthlyAttendance(c.id, today.year, today.month).catch(() => null)),
          ),
          Promise.all(
            activeClasses.map((c) => fetchMonthlyTuition(c.id, today.year, today.month).catch(() => null)),
          ),
          Promise.all(activeClasses.map((c) => fetchAssignments(c.id).catch(() => []))),
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

        const pendingTuition: PendingTuitionItem[] = [];
        tuitionResults.forEach((tuition, idx) => {
          if (!tuition) return;
          const c = activeClasses[idx];
          tuition.students.forEach((s) => {
            if (s.status === "PENDING") {
              pendingTuition.push({
                classId: c.id,
                className: c.name,
                studentId: s.studentId,
                fullName: s.fullName,
                totalAmount: s.totalAmount,
              });
            }
          });
        });
        setPendingTuitionItems(pendingTuition);

        const ungradedAssignments: UngradedAssignmentItem[] = [];
        assignmentsResults.forEach((assignments, idx) => {
          const c = activeClasses[idx];
          assignments.forEach((a) => {
            const ungradedCount = a.submittedCount - a.gradedCount;
            if (ungradedCount > 0) {
              ungradedAssignments.push({
                classId: c.id,
                className: c.name,
                assignmentId: a.id,
                title: a.title,
                ungradedCount,
              });
            }
          });
        });
        setUngradedAssignmentItems(ungradedAssignments);
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

  const actionItemCount = pendingTuitionItems.length + ungradedAssignmentItems.length;

  const activeClassCount = classes?.filter((c) => c.active).length ?? 0;
  const weeklySessionCount =
    classes?.filter((c) => c.active).reduce((sum, c) => sum + c.schedules.length, 0) ?? 0;

  const stats = [
    { label: t("teacher:overview.stats.classes"), value: activeClassCount, icon: Layers },
    { label: t("teacher:overview.stats.students"), value: studentCount, icon: Users },
    { label: t("teacher:overview.stats.sessionsThisWeek"), value: weeklySessionCount, icon: CalendarDays },
    { label: t("teacher:overview.stats.needsAction"), value: actionItemCount, icon: AlertCircle },
  ];

  const tuitionTotal = (tuitionTotals?.collected ?? 0) + (tuitionTotals?.outstanding ?? 0);
  const tuitionPercent = tuitionTotal > 0 ? Math.round(((tuitionTotals?.collected ?? 0) / tuitionTotal) * 100) : 0;

  return (
    <>
      <PageBanner
        title={t("teacher:overview.title")}
        subtitle={
          isLoading
            ? t("teacher:overview.greeting", { name: fullName || userName })
            : t("teacher:overview.greetingWithSessions", {
                name: fullName || userName,
                count: todaySessions.length,
              })
        }
        className="mb-6"
      />

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-background p-5">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-brown text-white">
              <stat.icon className="h-4.5 w-4.5" />
            </div>
            <div className="mb-1 text-sm text-muted-foreground">{stat.label}</div>
            <div className="text-3xl font-bold text-foreground">{stat.value}</div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.45fr_1fr] lg:items-start">
        <div className="rounded-xl border border-border bg-background p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2.5 font-heading text-lg font-semibold text-foreground">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-brown text-white">
                <CalendarClock className="h-4 w-4" />
              </span>
              {t("teacher:overview.todaySchedule.title")}
            </h2>
            <button
              type="button"
              onClick={() => navigate("/admin/attendance")}
              className="shrink-0 cursor-pointer text-sm font-medium text-status-warning-fg hover:underline"
            >
              {t("teacher:overview.todaySchedule.viewAll")}
            </button>
          </div>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{t("common:status.loading")}</p>
          ) : todaySessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("teacher:overview.todaySchedule.empty")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {todaySessions.map((session) => {
                const isComplete = session.totalCount > 0 && session.markedCount >= session.totalCount;
                const isStarted = session.markedCount > 0;
                const percent =
                  session.totalCount > 0 ? Math.round((session.markedCount / session.totalCount) * 100) : 0;
                return (
                  <li key={session.classId} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-foreground">{session.className}</div>
                        <div className="text-sm text-muted-foreground">
                          {displayTime(session.startTime)} - {displayTime(session.endTime)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={isComplete ? "success" : isStarted ? "warning" : "outline"}>
                          {isComplete
                            ? t("teacher:overview.todaySchedule.complete")
                            : t("teacher:overview.todaySchedule.progress", {
                                marked: session.markedCount,
                                total: session.totalCount,
                              })}
                        </Badge>
                        <Button
                          size="sm"
                          className="bg-brand-brown text-white hover:bg-brand-brown-dark"
                          onClick={() => navigate("/admin/attendance")}
                        >
                          <ClipboardCheck />
                          {t("teacher:overview.todaySchedule.markButton")}
                        </Button>
                      </div>
                    </div>
                    <Progress
                      value={percent}
                      className="mt-2.5"
                      indicatorClassName={isComplete ? "bg-status-success" : "bg-primary"}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-background p-5">
            <h2 className="mb-4 flex items-center gap-2.5 font-heading text-lg font-semibold text-foreground">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-status-danger-bg text-status-danger-fg">
                <AlertCircle className="h-4 w-4" />
              </span>
              {t("teacher:overview.needsAction.title")}
              {actionItemCount > 0 && <Badge variant="destructive">{actionItemCount}</Badge>}
            </h2>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">{t("common:status.loading")}</p>
            ) : actionItemCount === 0 ? (
              <p className="text-sm text-muted-foreground">{t("teacher:overview.needsAction.empty")}</p>
            ) : (
              <ul className="divide-y divide-border">
                {pendingTuitionItems.map((item) => (
                  <li key={`tuition-${item.classId}-${item.studentId}`}>
                    <button
                      type="button"
                      className="flex w-full cursor-pointer flex-wrap items-center justify-between gap-3 py-3 text-left transition-colors hover:bg-muted/50"
                      onClick={() => navigate(`/admin/tuition?classId=${item.classId}`)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-status-warning-bg text-status-warning-fg">
                          <Wallet className="h-4 w-4" />
                        </span>
                        <div>
                          <div className="font-medium text-foreground">
                            {t("teacher:overview.needsAction.tuitionItem", {
                              name: item.fullName,
                              className: item.className,
                            })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {t("teacher:overview.needsAction.tuitionItemAmount", {
                              amount: formatCurrency(item.totalAmount),
                            })}
                          </div>
                        </div>
                      </div>
                      <Badge variant="warning">{t("teacher:tuition.status.PENDING")}</Badge>
                    </button>
                  </li>
                ))}
                {ungradedAssignmentItems.map((item) => (
                  <li key={`assignment-${item.classId}-${item.assignmentId}`}>
                    <button
                      type="button"
                      className="flex w-full cursor-pointer flex-wrap items-center justify-between gap-3 py-3 text-left transition-colors hover:bg-muted/50"
                      onClick={() => navigate(`/admin/classes/${item.classId}?tab=assignments`)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-status-info-bg text-status-info-fg">
                          <PenSquare className="h-4 w-4" />
                        </span>
                        <div>
                          <div className="font-medium text-foreground">
                            {t("teacher:overview.needsAction.assignmentItem", {
                              title: item.title,
                              className: item.className,
                            })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {t("teacher:overview.needsAction.assignmentItemCount", { count: item.ungradedCount })}
                          </div>
                        </div>
                      </div>
                      <Badge variant="info">{item.ungradedCount}</Badge>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl bg-brand-brown p-5 text-white">
            <h2 className="mb-4 font-heading text-lg font-semibold text-white">
              {t("teacher:overview.tuition.title")}
            </h2>
            {isLoading ? (
              <p className="text-sm text-white/70">{t("common:status.loading")}</p>
            ) : (
              <>
                <Progress
                  value={tuitionPercent}
                  className="mb-3.5 h-2.5 bg-white/15"
                  indicatorClassName="bg-primary"
                />
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm text-white/70">{t("teacher:overview.tuition.collected")}</span>
                  <span className="font-semibold text-primary">
                    {formatCurrency(tuitionTotals?.collected ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70">{t("teacher:overview.tuition.outstanding")}</span>
                  <span className="font-semibold text-white">
                    {formatCurrency(tuitionTotals?.outstanding ?? 0)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

export default TeacherOverviewPage;
