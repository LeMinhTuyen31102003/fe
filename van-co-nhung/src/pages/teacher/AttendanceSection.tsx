import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import MonthYearPicker from "@/components/MonthYearPicker";
import { cn } from "@/lib/utils";
import {
  fetchMonthlyAttendance,
  markAttendance,
  type AttendanceMarkInput,
  type AttendanceStatus,
  type MonthlyAttendance,
} from "./attendanceApi";
import {
  getAttendanceStatusMeta,
  formatSessionDate,
  nextAttendanceStatus,
} from "./attendanceOptions";
import { fetchClasses, type ClassSummary } from "./classesApi";

function today() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

type PendingChange = AttendanceMarkInput & { date: string };

function pendingStorageKey(classId: number, year: number, month: number): string {
  return `attendance-pending:${classId}:${year}:${month}`;
}

function loadPendingChanges(classId: number, year: number, month: number): Map<string, PendingChange> {
  try {
    const raw = localStorage.getItem(pendingStorageKey(classId, year, month));
    if (!raw) return new Map();
    const list: PendingChange[] = JSON.parse(raw);
    return new Map(list.map((c) => [`${c.studentId}-${c.date}`, c]));
  } catch {
    return new Map();
  }
}

function savePendingChanges(
  classId: number,
  year: number,
  month: number,
  pending: Map<string, PendingChange>,
) {
  const key = pendingStorageKey(classId, year, month);
  if (pending.size === 0) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, JSON.stringify([...pending.values()]));
  }
}

function AttendanceSection() {
  const { t } = useTranslation(["teacher", "common"]);
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [{ year, month }, setPeriod] = useState(today);
  const [data, setData] = useState<MonthlyAttendance | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [extraDates, setExtraDates] = useState<string[]>([]);
  const [newDate, setNewDate] = useState("");
  const [pendingChanges, setPendingChanges] = useState<Map<string, PendingChange>>(new Map());
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
      .catch(() => toast.error(t("teacher:attendance.loadClassesError")))
      .finally(() => setIsLoadingClasses(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;
    let cancelled = false;
    const key = `${selectedClassId}-${year}-${month}`;

    const classId = Number(selectedClassId);
    fetchMonthlyAttendance(classId, year, month)
      .then((res) => {
        if (cancelled) return;
        const restored = loadPendingChanges(classId, year, month);
        for (const [entryKey, change] of restored) {
          const original = res.students.find((s) => s.studentId === change.studentId)?.entries[change.date]
            ?.status ?? null;
          if (original === change.status) restored.delete(entryKey);
        }
        setData(res);
        setExtraDates([]);
        setPendingChanges(restored);
        setLoadedKey(key);
        if (restored.size > 0) {
          toast.info(t("teacher:attendance.restoredPending", { count: restored.size }));
        }
      })
      .catch(() => {
        if (cancelled) return;
        setLoadedKey(key);
        toast.error(t("teacher:attendance.loadError"));
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, year, month]);

  function updatePendingChanges(updater: (prev: Map<string, PendingChange>) => Map<string, PendingChange>) {
    setPendingChanges((prev) => {
      const next = updater(prev);
      if (selectedClassId) {
        savePendingChanges(Number(selectedClassId), year, month, next);
      }
      return next;
    });
  }

  function handleAddDate() {
    if (!newDate) return;
    const [y, m] = newDate.split("-").map(Number);
    if (y !== year || m !== month) {
      toast.error(t("teacher:attendance.dateOutOfMonthError"));
      return;
    }
    setExtraDates((prev) => (prev.includes(newDate) ? prev : [...prev, newDate].sort()));
    setNewDate("");
  }

  const sessionDates = useMemo(() => {
    const set = new Set([...(data?.sessionDates ?? []), ...extraDates]);
    return [...set].sort();
  }, [data, extraDates]);

  const activeClasses = useMemo(() => classes.filter((c) => c.active), [classes]);
  const inactiveClasses = useMemo(() => classes.filter((c) => !c.active), [classes]);

  function statusFor(studentId: number, date: string): AttendanceStatus | null {
    const key = `${studentId}-${date}`;
    const pending = pendingChanges.get(key);
    if (pending) return pending.status;
    return data?.students.find((s) => s.studentId === studentId)?.entries[date]?.status ?? null;
  }

  function handleCellToggle(studentId: number, date: string) {
    if (isClassInactive) return;
    const current = statusFor(studentId, date);
    const next = nextAttendanceStatus(current);
    const original = data?.students.find((s) => s.studentId === studentId)?.entries[date]?.status ?? null;
    const key = `${studentId}-${date}`;

    updatePendingChanges((prev) => {
      const map = new Map(prev);
      if (next === original) {
        map.delete(key);
      } else {
        map.set(key, { studentId, date, status: next });
      }
      return map;
    });
  }

  async function handleConfirmSave() {
    if (!data || pendingChanges.size === 0) return;
    setIsSaving(true);
    try {
      const byDate = new Map<string, AttendanceMarkInput[]>();
      for (const { studentId, status, date } of pendingChanges.values()) {
        const list = byDate.get(date) ?? [];
        list.push({ studentId, status });
        byDate.set(date, list);
      }

      await Promise.all(
        [...byDate.entries()].map(([date, records]) => markAttendance(data.classId, date, records)),
      );

      const fresh = await fetchMonthlyAttendance(data.classId, year, month);
      setData(fresh);
      updatePendingChanges(() => new Map());
      setIsSaveDialogOpen(false);
      toast.success(t("teacher:attendance.saveSuccess"));
    } catch {
      toast.error(t("teacher:attendance.saveError"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-background p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-bold text-foreground">{t("teacher:attendance.title")}</h2>
        <div className="flex flex-wrap items-center gap-2.5">
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder={t("teacher:attendance.classPlaceholder")} />
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
          {t("teacher:attendance.inactiveLockBanner")}
        </p>
      )}

      {isLoadingClasses ? (
        <p className="text-sm text-muted-foreground">{t("common:status.loading")}</p>
      ) : classes.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("teacher:attendance.noClasses")}</p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">{t("common:status.loading")}</p>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">{t("teacher:attendance.loadError")}</p>
      ) : data.students.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("teacher:attendance.noStudents")}</p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div className="flex items-end gap-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="add-date">{t("teacher:attendance.addSessionLabel")}</Label>
                <Input
                  id="add-date"
                  type="date"
                  className="w-[180px]"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  disabled={isClassInactive}
                />
              </div>
              <Button type="button" variant="outline" onClick={handleAddDate} disabled={!newDate || isClassInactive}>
                {t("teacher:attendance.addSession")}
              </Button>
            </div>

            {!isClassInactive && pendingChanges.size > 0 && (
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => updatePendingChanges(() => new Map())}>
                  {t("teacher:attendance.discardChanges")}
                </Button>
                <Button type="button" size="sm" onClick={() => setIsSaveDialogOpen(true)}>
                  {t("teacher:attendance.saveChanges", { count: pendingChanges.size })}
                </Button>
              </div>
            )}
          </div>

          {sessionDates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("teacher:attendance.noSessionsInMonth")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 z-10 bg-background">
                      {t("teacher:attendance.table.fullName")}
                    </TableHead>
                    {sessionDates.map((date) => {
                      const { dayLabel, dateLabel } = formatSessionDate(date, t);
                      return (
                        <TableHead key={date} className="text-center">
                          <div className="flex flex-col items-center leading-tight">
                            <span>{dateLabel}</span>
                            <span className="text-[10px] font-normal text-muted-foreground">{dayLabel}</span>
                          </div>
                        </TableHead>
                      );
                    })}
                    <TableHead className="text-center">{t("teacher:attendance.table.present")}</TableHead>
                    <TableHead className="text-center">{t("teacher:attendance.table.absent")}</TableHead>
                    <TableHead className="text-center">{t("teacher:attendance.table.late")}</TableHead>
                    <TableHead className="text-center">{t("teacher:attendance.table.excused")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.students.map((student) => (
                    <TableRow key={student.studentId}>
                      <TableCell className="sticky left-0 z-10 bg-background font-medium">
                        {student.fullName}
                      </TableCell>
                      {sessionDates.map((date) => {
                        const status = statusFor(student.studentId, date);
                        const meta = status ? getAttendanceStatusMeta(t, status) : null;
                        const key = `${student.studentId}-${date}`;
                        const isPending = pendingChanges.has(key);
                        const notMarkedLabel = t("teacher:attendance.notMarked");
                        return (
                          <TableCell key={date} className="p-1 text-center">
                            <button
                              type="button"
                              disabled={isClassInactive}
                              onClick={() => handleCellToggle(student.studentId, date)}
                              className={cn(
                                "inline-flex h-8 w-10 items-center justify-center rounded-md text-xs font-semibold transition-colors",
                                meta ? meta.className : "bg-muted text-muted-foreground hover:bg-muted/70",
                                isClassInactive && "cursor-not-allowed opacity-60",
                                isPending && "ring-2 ring-amber-500 ring-offset-1",
                              )}
                              title={
                                isPending
                                  ? `${meta ? meta.label : notMarkedLabel} (${t("teacher:attendance.unsavedSuffix")})`
                                  : meta
                                    ? meta.label
                                    : notMarkedLabel
                              }
                            >
                              {meta ? meta.short : "–"}
                            </button>
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {student.summary.present}
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {student.summary.absent}
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {student.summary.late}
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {student.summary.excused}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("teacher:attendance.saveDialog.title")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("teacher:attendance.saveDialog.before")}{" "}
            <span className="font-semibold text-foreground">{pendingChanges.size}</span>{" "}
            {t("teacher:attendance.saveDialog.middle")}{" "}
            <span className="font-semibold text-foreground">{data?.className}</span>.{" "}
            {t("teacher:attendance.saveDialog.after")}
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsSaveDialogOpen(false)} disabled={isSaving}>
              {t("common:actions.cancel")}
            </Button>
            <Button type="button" onClick={handleConfirmSave} disabled={isSaving}>
              {isSaving ? t("common:status.saving") : t("teacher:attendance.confirmSave")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AttendanceSection;
