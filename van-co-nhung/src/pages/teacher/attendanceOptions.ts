import type { TFunction } from "i18next";
import type { AttendanceStatus } from "./attendanceApi";

export const ATTENDANCE_CYCLE: (AttendanceStatus | null)[] = [
  null,
  "PRESENT",
  "ABSENT",
  "LATE",
  "EXCUSED",
];

const ATTENDANCE_STATUS_CLASSNAME: Record<AttendanceStatus, string> = {
  PRESENT: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
  ABSENT: "bg-red-100 text-red-700 hover:bg-red-200",
  LATE: "bg-amber-100 text-amber-700 hover:bg-amber-200",
  EXCUSED: "bg-sky-100 text-sky-700 hover:bg-sky-200",
};

export function getAttendanceStatusMeta(t: TFunction, status: AttendanceStatus) {
  return {
    label: t(`common:attendanceStatus.${status}.label`),
    short: t(`common:attendanceStatus.${status}.short`),
    className: ATTENDANCE_STATUS_CLASSNAME[status],
  };
}

export function nextAttendanceStatus(current: AttendanceStatus | null): AttendanceStatus | null {
  const idx = ATTENDANCE_CYCLE.indexOf(current);
  return ATTENDANCE_CYCLE[(idx + 1) % ATTENDANCE_CYCLE.length];
}

export function displayMonth(month: number, t: TFunction) {
  return t(`common:months.${month}`, { defaultValue: `Tháng ${month}` });
}

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function formatSessionDate(iso: string, t: TFunction) {
  const d = new Date(iso + "T00:00:00");
  const dayLabel = t(`common:weekdaysShort.${WEEKDAY_KEYS[d.getDay()]}`);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return { dayLabel, dateLabel: `${dd}/${mm}` };
}
