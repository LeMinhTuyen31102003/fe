import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MonthYearPicker from "@/components/MonthYearPicker";
import PageBanner from "@/components/PageBanner";
import { getAttendanceStatusMeta, formatSessionDate } from "../teacher/attendanceOptions";
import { fetchMyAttendance, type MyClassAttendance } from "./myAttendanceApi";

function today() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function AttendanceCard({ attendance, t }: { attendance: MyClassAttendance; t: TFunction }) {
  const { className, sessions, summary } = attendance;
  const totalLearned = summary.present + summary.late;
  const [noteDialog, setNoteDialog] = useState<{ date: string; note: string } | null>(null);

  return (
    <div className="rounded-xl border border-border bg-background p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-heading text-lg font-bold text-foreground">{className}</h3>
        <span className="text-sm font-semibold text-foreground">
          {t("student:home.attendanceCard.sessionsLearned", { count: totalLearned })}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-border p-3">
          <div className="text-xs text-muted-foreground">{t("common:attendanceStatus.PRESENT.label")}</div>
          <div className="text-lg font-semibold text-emerald-700">{summary.present}</div>
        </div>
        <div className="rounded-lg border border-border p-3">
          <div className="text-xs text-muted-foreground">{t("common:attendanceStatus.LATE.label")}</div>
          <div className="text-lg font-semibold text-amber-700">{summary.late}</div>
        </div>
        <div className="rounded-lg border border-border p-3">
          <div className="text-xs text-muted-foreground">{t("common:attendanceStatus.ABSENT.label")}</div>
          <div className="text-lg font-semibold text-red-700">{summary.absent}</div>
        </div>
        <div className="rounded-lg border border-border p-3">
          <div className="text-xs text-muted-foreground">{t("common:attendanceStatus.EXCUSED.label")}</div>
          <div className="text-lg font-semibold text-sky-700">{summary.excused}</div>
        </div>
      </div>

      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("student:home.attendanceCard.noSessions")}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sessions.map((s) => {
            const meta = getAttendanceStatusMeta(t, s.status);
            const { dateLabel } = formatSessionDate(s.date, t);
            const badgeClassName = `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${meta.className}`;
            return s.note ? (
              <button
                key={s.date}
                type="button"
                className={badgeClassName}
                onClick={() => setNoteDialog({ date: dateLabel, note: s.note! })}
              >
                {dateLabel} · {meta.label}
                <MessageSquare className="h-3 w-3 shrink-0" fill="currentColor" />
              </button>
            ) : (
              <span key={s.date} className={badgeClassName}>
                {dateLabel} · {meta.label}
              </span>
            );
          })}
        </div>
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
  const { t } = useTranslation(["student", "common"]);
  const [{ year, month }, setPeriod] = useState(today);
  const [attendance, setAttendance] = useState<MyClassAttendance[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const currentKey = `${year}-${month}`;
  const isLoading = loadedKey !== currentKey;

  useEffect(() => {
    let cancelled = false;
    const key = `${year}-${month}`;

    fetchMyAttendance(year, month)
      .then((attendanceRes) => {
        if (cancelled) return;
        setAttendance(attendanceRes.classes);
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

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <PageBanner title={t("student:home.title")} subtitle={t("student:home.subtitle")} />

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
        <section className="flex flex-col gap-4">
          {attendance.map((a) => (
            <AttendanceCard key={a.classId} attendance={a} t={t} />
          ))}
        </section>
      )}
    </div>
  );
}

export default StudentHomePage;
