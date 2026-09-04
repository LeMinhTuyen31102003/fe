import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import MonthYearPicker from "@/components/MonthYearPicker";
import { fetchClasses, type ClassSummary } from "./classesApi";
import {
  fetchMonthlyTuition,
  updateTuition,
  type StudentTuitionRow,
  type TuitionStatus,
  type TuitionSummary,
} from "./tuitionApi";

function today() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function formatCurrency(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

function formatDate(value: string | null, locale: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PENDING_BADGE_CLASS = "border-amber-300 bg-amber-100 text-amber-800";

function TuitionSection() {
  const { t, i18n } = useTranslation(["teacher", "common"]);
  const locale = i18n.language === "en" ? "en-US" : "vi-VN";
  const STATUS_LABEL: Record<TuitionStatus, string> = {
    UNPAID: t("teacher:tuition.status.UNPAID"),
    PENDING: t("teacher:tuition.status.PENDING"),
    PAID: t("teacher:tuition.status.PAID"),
  };
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [{ year, month }, setPeriod] = useState(today);

  const [rows, setRows] = useState<StudentTuitionRow[]>([]);
  const [feePerSession, setFeePerSession] = useState<number | null>(null);
  const [summary, setSummary] = useState<TuitionSummary | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [rejectingRow, setRejectingRow] = useState<StudentTuitionRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const currentKey = selectedClassId ? `${selectedClassId}-${year}-${month}` : null;
  const isLoading = currentKey !== null && loadedKey !== currentKey;

  const selectedClass = classes.find((c) => String(c.id) === selectedClassId) ?? null;
  const isClassInactive = selectedClass !== null && !selectedClass.active;

  useEffect(() => {
    fetchClasses()
      .then((list) => {
        setClasses(list);
        const firstActive = list.find((c) => c.active);
        const initial = firstActive ?? list[0];
        if (initial) setSelectedClassId(String(initial.id));
      })
      .catch(() => toast.error(t("teacher:tuition.loadClassesError")))
      .finally(() => setIsLoadingClasses(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;
    let cancelled = false;
    const key = `${selectedClassId}-${year}-${month}`;

    fetchMonthlyTuition(Number(selectedClassId), year, month)
      .then((res) => {
        if (cancelled) return;
        setRows(res.students);
        setFeePerSession(res.feePerSession);
        setSummary(res.summary);
        setLoadedKey(key);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadedKey(key);
        toast.error(t("teacher:tuition.loadError"));
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, year, month]);

  function updateLocalRow(studentId: number, patch: Partial<StudentTuitionRow>) {
    setRows((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, ...patch } : r)));
  }

  async function saveRow(row: StudentTuitionRow) {
    if (!selectedClassId || isClassInactive) return;
    setSavingId(row.studentId);
    try {
      const updated = await updateTuition(Number(selectedClassId), row.studentId, year, month, {
        amount: row.amount,
        status: row.status,
        note: row.note,
      });
      setRows(updated.students);
      setSummary(updated.summary);
    } catch {
      toast.error(t("teacher:tuition.updateError"));
    } finally {
      setSavingId(null);
    }
  }

  function handleMarkPaid(row: StudentTuitionRow) {
    if (isClassInactive) return;
    if (
      !window.confirm(
        t("teacher:tuition.markPaidConfirm", { amount: formatCurrency(row.amount), name: row.fullName }),
      )
    ) {
      return;
    }
    updateLocalRow(row.studentId, { status: "PAID" });
    saveRow({ ...row, status: "PAID" });
  }

  const activeClasses = useMemo(() => classes.filter((c) => c.active), [classes]);
  const inactiveClasses = useMemo(() => classes.filter((c) => !c.active), [classes]);

  function openRejectDialog(row: StudentTuitionRow) {
    if (isClassInactive) return;
    setRejectingRow(row);
    setRejectReason("");
  }

  async function handleSubmitReject() {
    if (!rejectingRow || !selectedClassId || isClassInactive) return;
    if (!rejectReason.trim()) {
      toast.error(t("teacher:tuition.rejectReasonRequired"));
      return;
    }

    setIsRejecting(true);
    try {
      const updated = await updateTuition(Number(selectedClassId), rejectingRow.studentId, year, month, {
        amount: rejectingRow.amount,
        status: "UNPAID",
        note: rejectReason.trim(),
      });
      setRows(updated.students);
      setSummary(updated.summary);
      setRejectingRow(null);
      toast.success(t("teacher:tuition.rejectSuccess"));
    } catch {
      toast.error(t("teacher:tuition.rejectError"));
    } finally {
      setIsRejecting(false);
    }
  }

  return (
    <>
    <div className="rounded-xl border border-border bg-background p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-bold text-foreground">{t("teacher:tuition.title")}</h2>
        <div className="flex flex-wrap items-center gap-2.5">
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder={t("teacher:tuition.classPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {activeClasses.length > 0 && (
                <SelectGroup>
                  {inactiveClasses.length > 0 && <SelectLabel>{t("teacher:classStatus.active")}</SelectLabel>}
                  {activeClasses.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
              {inactiveClasses.length > 0 && (
                <SelectGroup>
                  <SelectLabel>{t("teacher:classStatus.inactive")}</SelectLabel>
                  {inactiveClasses.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>

          <MonthYearPicker year={year} month={month} onChange={setPeriod} />
        </div>
      </div>

      {isClassInactive && (
        <p className="mb-4 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          {t("teacher:tuition.inactiveLockBanner")}
        </p>
      )}

      {isLoadingClasses ? (
        <p className="text-sm text-muted-foreground">{t("common:status.loading")}</p>
      ) : classes.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("teacher:tuition.noClasses")}</p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">{t("common:status.loading")}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("teacher:tuition.noStudents")}</p>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {t("teacher:tuition.feeInfoBefore")}{" "}
            <span className="font-semibold text-foreground">
              {feePerSession != null ? formatCurrency(feePerSession) : t("teacher:tuition.feeNotSet")}
            </span>{" "}
            {t("teacher:tuition.feeInfoMiddle")}{" "}
            <span className="font-semibold text-foreground">{t("teacher:tuition.presentWord")}</span> /{" "}
            <span className="font-semibold text-foreground">{t("teacher:tuition.lateWord")}</span>{" "}
            {t("teacher:tuition.feeInfoAfter")}
          </p>

          {summary && (
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground">{t("teacher:tuition.summary.totalDue")}</div>
                <div className="text-lg font-semibold text-foreground">{formatCurrency(summary.totalDue)}</div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground">{t("teacher:tuition.summary.totalCollected")}</div>
                <div className="text-lg font-semibold text-emerald-700">
                  {formatCurrency(summary.totalCollected)}
                </div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground">{t("teacher:tuition.summary.totalOutstanding")}</div>
                <div className="text-lg font-semibold text-red-700">
                  {formatCurrency(summary.totalOutstanding)}
                </div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground">{t("teacher:tuition.summary.pendingCount")}</div>
                <div className="text-lg font-semibold text-amber-700">
                  {summary.pendingCount} {t("teacher:tuition.summary.pendingCountSuffix")}
                </div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground">{t("teacher:tuition.summary.paidCount")}</div>
                <div className="text-lg font-semibold text-foreground">
                  {summary.paidCount}/{summary.totalStudents} {t("teacher:tuition.summary.paidCountSuffix")}
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("teacher:tuition.table.fullName")}</TableHead>
                  <TableHead className="text-center">{t("teacher:tuition.table.sessionCount")}</TableHead>
                  <TableHead className="w-[160px]">{t("teacher:tuition.table.amount")}</TableHead>
                  <TableHead className="text-center">{t("teacher:tuition.table.status")}</TableHead>
                  <TableHead>{t("teacher:tuition.table.time")}</TableHead>
                  <TableHead>{t("teacher:tuition.table.note")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.studentId}>
                    <TableCell className="font-medium">{row.fullName}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{row.sessionCount}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step={1000}
                        value={row.amount}
                        disabled={savingId === row.studentId || isClassInactive}
                        onChange={(e) =>
                          updateLocalRow(row.studentId, { amount: Number(e.target.value) || 0 })
                        }
                        onBlur={() => saveRow(row)}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      {row.status === "PENDING" ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <Badge variant="outline" className={PENDING_BADGE_CLASS}>
                            {STATUS_LABEL.PENDING}
                          </Badge>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={savingId === row.studentId || isClassInactive}
                              className="text-xs font-semibold text-brand-dark underline-offset-4 hover:underline"
                              onClick={() => handleMarkPaid(row)}
                            >
                              {t("common:actions.confirm")}
                            </button>
                            <button
                              type="button"
                              disabled={savingId === row.studentId || isClassInactive}
                              className="text-xs font-semibold text-destructive underline-offset-4 hover:underline"
                              onClick={() => openRejectDialog(row)}
                            >
                              {t("teacher:tuition.reject")}
                            </button>
                          </div>
                        </div>
                      ) : row.status === "PAID" ? (
                        <Badge variant="default" title={t("teacher:tuition.paidBadgeTitle")}>
                          {STATUS_LABEL.PAID}
                        </Badge>
                      ) : (
                        <button
                          type="button"
                          disabled={savingId === row.studentId || isClassInactive}
                          onClick={() => handleMarkPaid(row)}
                        >
                          <Badge variant="secondary" className="cursor-pointer">
                            {STATUS_LABEL.UNPAID}
                          </Badge>
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.status === "PENDING" ? (
                        <span className="text-xs text-amber-700">
                          {t("teacher:tuition.requestedAt", { time: formatDate(row.requestedAt, locale) })}
                        </span>
                      ) : (
                        formatDate(row.paidAt, locale)
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.note ?? ""}
                        disabled={savingId === row.studentId || isClassInactive}
                        placeholder="—"
                        onChange={(e) => updateLocalRow(row.studentId, { note: e.target.value })}
                        onBlur={() => saveRow(row)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>

    <Dialog open={rejectingRow !== null} onOpenChange={(open) => !open && setRejectingRow(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("teacher:tuition.rejectDialog.title")}</DialogTitle>
        </DialogHeader>
        {rejectingRow && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              {t("teacher:tuition.rejectDialog.before")}{" "}
              <span className="font-semibold text-foreground">{rejectingRow.fullName}</span>{" "}
              {t("teacher:tuition.rejectDialog.middle")} {formatCurrency(rejectingRow.amount)}.{" "}
              {t("teacher:tuition.rejectDialog.after")}
            </p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reject-reason">{t("teacher:tuition.rejectDialog.reasonLabel")}</Label>
              <Textarea
                id="reject-reason"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                disabled={isRejecting}
                placeholder={t("teacher:tuition.rejectDialog.reasonPlaceholder")}
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setRejectingRow(null)}
                disabled={isRejecting}
              >
                {t("common:actions.cancel")}
              </Button>
              <Button type="button" className="flex-1" onClick={handleSubmitReject} disabled={isRejecting}>
                {isRejecting ? t("common:status.sending") : t("teacher:tuition.reject")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}

export default TuitionSection;
