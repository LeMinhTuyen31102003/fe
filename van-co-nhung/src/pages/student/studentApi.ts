import type { TFunction } from "i18next";
import { authHeaders } from "../teacher/apiClient";

export interface ScheduleSlot {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface ClassScheduleGroup {
  classId: number;
  className: string;
  slots: ScheduleSlot[];
}

export interface MySchedule {
  classes: ClassScheduleGroup[];
}

export interface Classmate {
  id: number;
  fullName: string;
  grade: string | null;
}

export interface ClassmateGroup {
  classId: number;
  className: string;
  classmates: Classmate[];
}

export interface MyClassmates {
  classes: ClassmateGroup[];
}

export interface TeacherContact {
  fullName: string;
  email: string | null;
  phone: string | null;
}

export const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export function getDayLabel(t: TFunction, dayOfWeek: string): string {
  return t(`student:days.${dayOfWeek}`, { defaultValue: dayOfWeek });
}

export function formatTime(value: string): string {
  return value.slice(0, 5);
}

export async function fetchMySchedule(): Promise<MySchedule> {
  const res = await fetch("/api/me/schedule", { headers: authHeaders() });
  if (!res.ok) throw new Error("LOAD_FAILED");
  return res.json();
}

export async function fetchMyClassmates(): Promise<MyClassmates> {
  const res = await fetch("/api/me/classmates", { headers: authHeaders() });
  if (!res.ok) throw new Error("LOAD_FAILED");
  return res.json();
}

export async function fetchMyTeacher(): Promise<TeacherContact | null> {
  const res = await fetch("/api/me/teacher", { headers: authHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("LOAD_FAILED");
  return res.json();
}
