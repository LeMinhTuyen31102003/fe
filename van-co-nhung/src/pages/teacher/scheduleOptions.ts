import type { TFunction } from "i18next";

export const DAY_OF_WEEK_OPTIONS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const DAY_ORDER = DAY_OF_WEEK_OPTIONS;

export function displayDayOfWeek(dayOfWeek: string, t: TFunction) {
  return t(`teacher:schedule.days.${dayOfWeek}.label`, { defaultValue: dayOfWeek });
}

function displayDayOfWeekShort(dayOfWeek: string, t: TFunction) {
  return t(`teacher:schedule.days.${dayOfWeek}.short`, { defaultValue: dayOfWeek });
}

export function displayTime(time: string) {
  return time.slice(0, 5);
}

export interface ScheduleSlotLike {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export function formatScheduleSlot(slot: ScheduleSlotLike, t: TFunction) {
  return `${displayDayOfWeek(slot.dayOfWeek, t)} · ${displayTime(slot.startTime)} - ${displayTime(slot.endTime)}`;
}

export function sortSchedules<T extends ScheduleSlotLike>(slots: T[]): T[] {
  return [...slots].sort((a, b) => {
    const dayDiff = DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek);
    if (dayDiff !== 0) return dayDiff;
    return a.startTime.localeCompare(b.startTime);
  });
}

export function formatSchedulesCompact(slots: ScheduleSlotLike[], t: TFunction) {
  if (slots.length === 0) return null;
  return sortSchedules(slots)
    .map((s) => `${displayDayOfWeekShort(s.dayOfWeek, t)} ${displayTime(s.startTime)}`)
    .join(", ");
}
