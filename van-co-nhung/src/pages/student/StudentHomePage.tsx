import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MonthYearPicker from "@/components/MonthYearPicker";
import { getAttendanceStatusMeta, formatSessionDate } from "../teacher/attendanceOptions";
import { fetchBankSettings, type BankSettings } from "../teacher/bankSettingsApi";
import { fetchMyAttendance, type MyClassAttendance } from "./myAttendanceApi";
import { confirmMyPayment, fetchMyTuition, type MyClassTuition } from "./myTuitionApi";

function today() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function formatCurrency(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

function formatDateTime(value: string | null, language: string) {
  if (!value) return "";
  return new Date(value).toLocaleString(language === "en" ? "en-US" : "vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildQrUrl(bank: BankSettings, classTuition: MyClassTuition, year: number, month: number) {
  const info = `Hoc phi ${classTuition.className} T${month}-${year}`;
  const params = new URLSearchParams({
    amount: String(classTuition.amount),
    addInfo: info,
    accountName: bank.accountName ?? "",
  });
  return `https://img.vietqr.io/image/${bank.bankId}-${bank.accountNumber}-compact2.png?${params.toString()}`;
}

function AttendanceCard({ attendance, t }: { attendance: MyClassAttendance; t: TFunction }) {
  const { className, sessions, summary } = attendance;
  const totalLearned = summary.present + summary.late;

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
            return (
              <span
                key={s.date}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${meta.className}`}
              >
                {dateLabel} · {meta.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TuitionCard({
  classTuition,
  bank,
  year,
  month,
  onConfirmed,
  t,
  language,
}: {
  classTuition: MyClassTuition;
  bank: BankSettings | null;
  year: number;
  month: number;
  onConfirmed: (updated: MyClassTuition) => void;
  t: TFunction;
  language: string;
}) {
  const { classId, className, sessionCount, feePerSession, amount, status, requestedAt, paidAt, note } =
    classTuition;
  const [isConfirming, setIsConfirming] = useState(false);

  async function handleConfirm() {
    if (
      !window.confirm(
        t("student:home.tuitionCard.confirmDialog", { amount: formatCurrency(amount), className }),
      )
    ) {
      return;
    }
    setIsConfirming(true);
    try {
      const updated = await confirmMyPayment(classId, year, month);
      onConfirmed(updated);
      toast.success(t("student:home.tuitionCard.confirmSuccess"));
    } catch {
      toast.error(t("student:home.tuitionCard.confirmError"));
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-background p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-heading text-lg font-bold text-foreground">{className}</h3>
        <Badge
          variant={status === "PAID" ? "default" : status === "PENDING" ? "outline" : "secondary"}
          className={status === "PENDING" ? "border-amber-300 bg-amber-100 text-amber-800" : undefined}
        >
          {t(`student:home.tuitionCard.status.${status}`)}
        </Badge>
      </div>

      <dl className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">{t("student:home.tuitionCard.sessionCount")}</dt>
          <dd className="text-sm font-semibold text-foreground">
            {t("student:home.tuitionCard.sessionCountValue", { count: sessionCount })}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t("student:home.tuitionCard.feePerSession")}</dt>
          <dd className="text-sm font-semibold text-foreground">
            {t("student:home.tuitionCard.feePerSessionValue", { amount: formatCurrency(feePerSession) })}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t("student:home.tuitionCard.amount")}</dt>
          <dd className="text-sm font-semibold text-foreground">{formatCurrency(amount)}</dd>
        </div>
      </dl>

      {status === "PAID" ? (
        <p className="text-sm text-muted-foreground">
          {paidAt
            ? t("student:home.tuitionCard.paidNoteWithDate", { date: formatDateTime(paidAt, language) })
            : t("student:home.tuitionCard.paidNote")}
        </p>
      ) : status === "PENDING" ? (
        <p className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          {t("student:home.tuitionCard.pendingNote", { date: formatDateTime(requestedAt, language) })}
        </p>
      ) : amount <= 0 ? (
        <p className="text-sm text-muted-foreground">{t("student:home.tuitionCard.noFeeThisMonth")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {note && (
            <p className="rounded-lg border border-dashed border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {t("student:home.tuitionCard.rejectedNotePrefix")}{" "}
              <span className="font-medium">{note}</span>{" "}
              {t("student:home.tuitionCard.rejectedNoteSuffix")}
            </p>
          )}
          {!bank || !bank.configured ? (
            <p className="text-sm text-muted-foreground">{t("student:home.tuitionCard.noBankConfigured")}</p>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-4">
              <img
                src={buildQrUrl(bank, classTuition, year, month)}
                alt={t("student:home.tuitionCard.qrAlt", { className })}
                className="h-auto w-full max-w-[260px]"
              />
              <p className="text-center text-xs text-muted-foreground">
                {t("student:home.tuitionCard.qrInstructions", {
                  amount: formatCurrency(amount),
                  accountName: bank.accountName,
                  bankName: bank.bankName,
                })}
              </p>
              <Button type="button" onClick={handleConfirm} disabled={isConfirming} className="w-full max-w-[260px]">
                {isConfirming ? t("common:status.sending") : t("student:home.tuitionCard.confirmButton")}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StudentHomePage() {
  const { t, i18n } = useTranslation(["student", "common"]);
  const [{ year, month }, setPeriod] = useState(today);
  const [classes, setClasses] = useState<MyClassTuition[]>([]);
  const [attendance, setAttendance] = useState<MyClassAttendance[]>([]);
  const [bank, setBank] = useState<BankSettings | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const currentKey = `${year}-${month}`;
  const isLoading = loadedKey !== currentKey;

  useEffect(() => {
    fetchBankSettings()
      .then(setBank)
      .catch(() => {
        /* QR simply won't render if this fails */
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const key = `${year}-${month}`;

    Promise.all([fetchMyTuition(year, month), fetchMyAttendance(year, month)])
      .then(([tuitionRes, attendanceRes]) => {
        if (cancelled) return;
        setClasses(tuitionRes.classes);
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

  function handleConfirmed(updated: MyClassTuition) {
    setClasses((prev) => prev.map((c) => (c.classId === updated.classId ? updated : c)));
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{t("student:home.title")}</h1>
          <p className="text-muted-foreground">{t("student:home.subtitle")}</p>
        </div>
        <MonthYearPicker year={year} month={month} onChange={setPeriod} />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("common:status.loading")}</p>
      ) : classes.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("student:home.emptyState")}</p>
      ) : (
        <>
          <section className="flex flex-col gap-4">
            <h2 className="font-heading text-lg font-bold text-foreground">{t("student:home.attendanceSection")}</h2>
            {attendance.map((a) => (
              <AttendanceCard key={a.classId} attendance={a} t={t} />
            ))}
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="font-heading text-lg font-bold text-foreground">{t("student:home.tuitionSection")}</h2>
            {classes.map((c) => (
              <TuitionCard
                key={c.classId}
                classTuition={c}
                bank={bank}
                year={year}
                month={month}
                onConfirmed={handleConfirmed}
                t={t}
                language={i18n.language}
              />
            ))}
          </section>
        </>
      )}
    </div>
  );
}

export default StudentHomePage;
