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
  PRESENT: "bg-status-success-bg text-status-success-fg hover:bg-status-success-bg/70",
  ABSENT: "bg-status-danger-bg text-status-danger-fg hover:bg-status-danger-bg/70",
  LATE: "bg-status-warning-bg text-status-warning-fg hover:bg-status-warning-bg/70",
  EXCUSED: "bg-status-info-bg text-status-info-fg hover:bg-status-info-bg/70",
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
