export const DAY_OF_WEEK_OPTIONS = [
  { value: "MONDAY", label: "Thứ 2", short: "T2" },
  { value: "TUESDAY", label: "Thứ 3", short: "T3" },
  { value: "WEDNESDAY", label: "Thứ 4", short: "T4" },
  { value: "THURSDAY", label: "Thứ 5", short: "T5" },
  { value: "FRIDAY", label: "Thứ 6", short: "T6" },
  { value: "SATURDAY", label: "Thứ 7", short: "T7" },
  { value: "SUNDAY", label: "Chủ nhật", short: "CN" },
];

const DAY_ORDER = DAY_OF_WEEK_OPTIONS.map((d) => d.value);

export function displayDayOfWeek(dayOfWeek: string) {
  return DAY_OF_WEEK_OPTIONS.find((d) => d.value === dayOfWeek)?.label ?? dayOfWeek;
}

function displayDayOfWeekShort(dayOfWeek: string) {
  return DAY_OF_WEEK_OPTIONS.find((d) => d.value === dayOfWeek)?.short ?? dayOfWeek;
}

export function displayTime(time: string) {
  return time.slice(0, 5);
}

export interface ScheduleSlotLike {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export function formatScheduleSlot(slot: ScheduleSlotLike) {
  return `${displayDayOfWeek(slot.dayOfWeek)} · ${displayTime(slot.startTime)} - ${displayTime(slot.endTime)}`;
}

export function sortSchedules<T extends ScheduleSlotLike>(slots: T[]): T[] {
  return [...slots].sort((a, b) => {
    const dayDiff = DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek);
    if (dayDiff !== 0) return dayDiff;
    return a.startTime.localeCompare(b.startTime);
  });
}

export function formatSchedulesCompact(slots: ScheduleSlotLike[]) {
  if (slots.length === 0) return null;
  return sortSchedules(slots)
    .map((s) => `${displayDayOfWeekShort(s.dayOfWeek)} ${displayTime(s.startTime)}`)
    .join(", ");
}
