import { authHeaders } from "./apiClient";
import type { Student } from "./studentsApi";

export interface ScheduleSlot {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface ScheduleSlotInput {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface ClassSummary {
  id: number;
  name: string;
  grade: string | null;
  schedules: ScheduleSlot[];
  note: string | null;
  active: boolean;
  studentCount: number;
}

export interface ClassDetail {
  id: number;
  name: string;
  grade: string | null;
  schedules: ScheduleSlot[];
  note: string | null;
  active: boolean;
  students: Student[];
}

export interface ClassInput {
  name: string;
  grade: string;
  schedules: ScheduleSlotInput[];
  note: string;
}

export async function fetchClasses(): Promise<ClassSummary[]> {
  const res = await fetch("/api/classes", { headers: authHeaders() });
  if (!res.ok) throw new Error("LOAD_FAILED");
  return res.json();
}

export async function fetchClassDetail(id: number): Promise<ClassDetail> {
  const res = await fetch(`/api/classes/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("LOAD_FAILED");
  return res.json();
}

export async function createClass(input: ClassInput): Promise<ClassSummary> {
  const res = await fetch("/api/classes", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("CREATE_FAILED");
  return res.json();
}

export async function updateClass(id: number, input: ClassInput): Promise<ClassSummary> {
  const res = await fetch(`/api/classes/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("UPDATE_FAILED");
  return res.json();
}

export async function setClassActive(id: number, active: boolean): Promise<ClassSummary> {
  const res = await fetch(`/api/classes/${id}/active`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ active }),
  });
  if (!res.ok) throw new Error("UPDATE_FAILED");
  return res.json();
}

export async function deleteClass(id: number): Promise<void> {
  const res = await fetch(`/api/classes/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("DELETE_FAILED");
}

export async function addStudentToClass(classId: number, studentId: number): Promise<ClassDetail> {
  const res = await fetch(`/api/classes/${classId}/students/${studentId}`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("ADD_STUDENT_FAILED");
  return res.json();
}

export async function removeStudentFromClass(classId: number, studentId: number): Promise<ClassDetail> {
  const res = await fetch(`/api/classes/${classId}/students/${studentId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("REMOVE_STUDENT_FAILED");
  return res.json();
}
