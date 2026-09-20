import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Check, CheckCheck, MessageSquare, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ConfirmDialog";
import DatePicker from "@/components/DatePicker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { cn } from "@/lib/utils";
import {
  fetchMonthlyAttendance,
  markAttendance,
  type AttendanceStatus,
  type MonthlyAttendance,
} from "./attendanceApi";
import { ATTENDANCE_CYCLE, getAttendanceStatusMeta } from "./attendanceOptions";
import { fetchClasses, type ClassSummary } from "./classesApi";

const RADIO_STATUSES = ATTENDANCE_CYCLE.filter((s): s is AttendanceStatus => s !== null);

function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseIsoDate(iso: string): { year: number; month: number } {
  const [y, m] = iso.split("-").map(Number);
  return { year: y, month: m };
}

function AttendanceSection() {
  const { t } = useTranslation(["teacher", "common"]);
  const todayIso = getTodayIso();
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
  const [data, setData] = useState<MonthlyAttendance | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [editingPastKey, setEditingPastKey] = useState<string | null>(null);
  const [noteDialogStudentId, setNoteDialogStudentId] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isMarkAllDialogOpen, setIsMarkAllDialogOpen] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const currentKey = selectedClassId ? `${selectedClassId}-${selectedDate}` : null;
  const isLoading = currentKey !== null && loadedKey !== currentKey;
  const isPastDate = selectedDate < todayIso;
  const isEditingPast = currentKey !== null && editingPastKey === currentKey;

  const selectedClass = classes.find((c) => String(c.id) === selectedClassId) ?? null;
  const isClassInactive = selectedClass !== null && !selectedClass.active;
  const isReadOnly = isClassInactive;
  const isEditable = !isReadOnly && (!isPastDate || isEditingPast);

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
    const key = `${selectedClassId}-${selectedDate}`;
    const classId = Number(selectedClassId);
    const { year, month } = parseIsoDate(selectedDate);

    fetchMonthlyAttendance(classId, year, month)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setLoadedKey(key);
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
  }, [selectedClassId, selectedDate]);

  const activeClasses = useMemo(() => classes.filter((c) => c.active), [classes]);
  const inactiveClasses = useMemo(() => classes.filter((c) => !c.active), [classes]);

  function setLocalStatus(studentId: number, status: AttendanceStatus, note: string | null) {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        students: prev.students.map((s) =>
          s.studentId === studentId
            ? { ...s, entries: { ...s.entries, [selectedDate]: { status, note } } }
            : s,
        ),
      };
    });
  }

  async function handleSelectStatus(studentId: number, status: AttendanceStatus) {
    if (!isEditable || !selectedClassId) return;
    const student = data?.students.find((s) => s.studentId === studentId);
    const previous = student?.entries[selectedDate]?.status ?? null;
    // Preserve whatever note this day already had — changing the status alone
    // must not silently wipe out a "học bù"-style note attached to it.
    const currentNote = student?.entries[selectedDate]?.note ?? null;
    if (previous === status) return;

    setSavingIds((prev) => new Set(prev).add(studentId));
    setLocalStatus(studentId, status, currentNote);

    try {
      await markAttendance(Number(selectedClassId), selectedDate, [{ studentId, status, note: currentNote }]);
    } catch {
      if (previous) {
        setLocalStatus(studentId, previous, currentNote);
      }
      toast.error(t("teacher:attendance.saveError"));
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
    }
  }

  function openNoteDialog(studentId: number) {
    const currentNote = data?.students.find((s) => s.studentId === studentId)?.entries[selectedDate]?.note ?? "";
    setNoteDraft(currentNote ?? "");
    setNoteDialogStudentId(studentId);
  }

  function cancelNoteDialog() {
    setNoteDialogStudentId(null);
  }

  async function confirmNoteDialog() {
    if (noteDialogStudentId === null || !selectedClassId) return;
    const student = data?.students.find((s) => s.studentId === noteDialogStudentId);
    const currentStatus = student?.entries[selectedDate]?.status ?? null;
    if (!currentStatus) return;
    const trimmedNote = noteDraft.trim() || null;

    setIsSavingNote(true);
    try {
      await markAttendance(Number(selectedClassId), selectedDate, [
        { studentId: noteDialogStudentId, status: currentStatus, note: trimmedNote },
      ]);
      setLocalStatus(noteDialogStudentId, currentStatus, trimmedNote);
      setNoteDialogStudentId(null);
    } catch {
      toast.error(t("teacher:attendance.noteSaveError"));
    } finally {
      setIsSavingNote(false);
    }
  }

  async function handleMarkAllPresent() {
    if (!isEditable || !selectedClassId || !data || data.students.length === 0) return;
    const snapshot = data.students.map((s) => ({
      studentId: s.studentId,
      entry: s.entries[selectedDate] ?? null,
    }));

    setIsMarkingAll(true);
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        students: prev.students.map((s) => ({
          ...s,
          entries: {
            ...s.entries,
            [selectedDate]: { status: "PRESENT", note: s.entries[selectedDate]?.note ?? null },
          },
        })),
      };
    });

    try {
      const records = snapshot.map(({ studentId, entry }) => ({
        studentId,
        status: "PRESENT" as AttendanceStatus,
        note: entry?.note ?? null,
      }));
      await markAttendance(Number(selectedClassId), selectedDate, records);
      toast.success(t("teacher:attendance.markAllSuccess"));
      setIsMarkAllDialogOpen(false);
    } catch {
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          students: prev.students.map((s) => {
            const snap = snapshot.find((x) => x.studentId === s.studentId);
            const nextEntries = { ...s.entries };
            if (snap?.entry) {
              nextEntries[selectedDate] = snap.entry;
            } else {
              delete nextEntries[selectedDate];
            }
            return { ...s, entries: nextEntries };
          }),
        };
      });
      toast.error(t("teacher:attendance.markAllError"));
    } finally {
      setIsMarkingAll(false);
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

          <DatePicker value={selectedDate} onChange={setSelectedDate} max={todayIso} />
        </div>
      </div>

      {isClassInactive && (
        <p className="mb-4 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          {t("teacher:attendance.inactiveLockBanner")}
        </p>
      )}
      {!isClassInactive && isPastDate && data && data.sessionDates.includes(selectedDate) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          <span>{isEditingPast ? t("teacher:attendance.editingPastDateNotice") : t("teacher:attendance.viewOnlyPastDateNotice")}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditingPastKey((prev) => (prev === currentKey ? null : currentKey))}
          >
            {isEditingPast ? <Check /> : <Pencil />}
            {isEditingPast ? t("teacher:attendance.doneEditingPast") : t("teacher:attendance.editPast")}
          </Button>
        </div>
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
      ) : !data.sessionDates.includes(selectedDate) ? (
        <p className="rounded-lg border border-dashed border-border bg-muted/40 px-3 py-6 text-center text-sm text-muted-foreground">
          {t("teacher:attendance.noScheduleThisDay")}
        </p>
      ) : (
        <div>
          {isEditable && (
            <div className="mb-3 flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsMarkAllDialogOpen(true)}
              >
                <CheckCheck />
                {t("teacher:attendance.markAllButton")}
              </Button>
            </div>
          )}
          <div className="overflow-x-auto">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-10 w-40 max-w-[160px] bg-background">
                  {t("teacher:attendance.table.fullName")}
                </TableHead>
                <TableHead className="sticky left-40 z-10 w-40 max-w-[160px] bg-background">
                  {t("teacher:attendance.table.parentName")}
                </TableHead>
                <TableHead className="text-right">{t("teacher:attendance.table.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.students.map((student) => {
                const status = student.entries[selectedDate]?.status ?? null;
                const isSaving = savingIds.has(student.studentId);
                const rowDisabled = !isEditable || isSaving;
                return (
                  <TableRow key={student.studentId}>
                    <TableCell
                      title={student.fullName}
                      className="sticky left-0 z-10 w-40 max-w-[160px] truncate bg-background font-medium"
                    >
                      {student.fullName}
                    </TableCell>
                    <TableCell
                      title={student.parentName ?? undefined}
                      className="sticky left-40 z-10 w-40 max-w-[160px] truncate bg-background text-muted-foreground"
                    >
                      {student.parentName ?? "–"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <RadioGroup
                          value={status ?? ""}
                          onValueChange={(v) => handleSelectStatus(student.studentId, v as AttendanceStatus)}
                          disabled={rowDisabled}
                          className={cn(
                            "shrink-0 flex-nowrap gap-1 rounded-lg bg-muted/40 p-1",
                            isSaving && "opacity-60",
                          )}
                        >
                          {RADIO_STATUSES.map((s) => {
                            const meta = getAttendanceStatusMeta(t, s);
                            const inputId = `att-${student.studentId}-${s}`;
                            const isActive = status === s;
                            return (
                              <div key={s} className="shrink-0">
                                <RadioGroupItem value={s} id={inputId} className="sr-only" />
                                <Label
                                  htmlFor={inputId}
                                  title={meta.label}
                                  className={cn(
                                    "flex h-8 min-w-9 items-center justify-center rounded-md px-2 text-xs font-semibold whitespace-nowrap transition-colors",
                                    isActive ? meta.className : "text-muted-foreground hover:bg-background",
                                    rowDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                                  )}
                                >
                                  {meta.short}
                                </Label>
                              </div>
                            );
                          })}
                        </RadioGroup>
                        {status && (
                          <button
                            type="button"
                            title={student.entries[selectedDate]?.note ?? t("teacher:attendance.addNoteLabel")}
                            className={cn(
                              "shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-cream hover:text-foreground",
                              student.entries[selectedDate]?.note && "text-brand-dark",
                            )}
                            onClick={() => openNoteDialog(student.studentId)}
                            disabled={rowDisabled}
                          >
                            <MessageSquare className="h-4 w-4" fill={student.entries[selectedDate]?.note ? "currentColor" : "none"} />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={isMarkAllDialogOpen}
        onOpenChange={setIsMarkAllDialogOpen}
        title={t("teacher:attendance.markAllConfirmTitle")}
        description={t("teacher:attendance.markAllConfirmDescription")}
        onConfirm={handleMarkAllPresent}
        isConfirming={isMarkingAll}
      />

      <Dialog open={noteDialogStudentId !== null} onOpenChange={(open) => !open && cancelNoteDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("teacher:attendance.noteDialogTitle", {
                name: data?.students.find((s) => s.studentId === noteDialogStudentId)?.fullName ?? "",
              })}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            rows={4}
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder={t("teacher:attendance.notePlaceholder")}
            disabled={isSavingNote}
            autoFocus
          />
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={cancelNoteDialog}
              disabled={isSavingNote}
            >
              <X />
              {t("common:actions.cancel")}
            </Button>
            <Button type="button" className="flex-1" onClick={confirmNoteDialog} disabled={isSavingNote}>
              <Check />
              {isSavingNote ? t("common:status.saving") : t("common:actions.confirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AttendanceSection;
