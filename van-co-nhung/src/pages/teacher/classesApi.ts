import { apiUrl, authHeaders } from "./apiClient";
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
  feePerSession: number | null;
  active: boolean;
  studentCount: number;
}

export interface ClassDetail {
  id: number;
  name: string;
  grade: string | null;
  schedules: ScheduleSlot[];
  note: string | null;
  feePerSession: number | null;
  active: boolean;
  students: Student[];
}

export interface ClassInput {
  name: string;
  grade: string;
  schedules: ScheduleSlotInput[];
  note: string;
  feePerSession: number | null;
}

export interface FetchClassesParams {
  search?: string;
  status?: "all" | "active" | "inactive";
  assignableToStudentId?: number | null;
  sortBy?: "name" | "grade" | "studentCount" | "active";
  sortDir?: "asc" | "desc";
}

export async function fetchClasses(params: FetchClassesParams = {}): Promise<ClassSummary[]> {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.status && params.status !== "all") qs.set("status", params.status);
  if (params.assignableToStudentId != null) qs.set("assignableToStudentId", String(params.assignableToStudentId));
  if (params.sortBy) qs.set("sortBy", params.sortBy);
  if (params.sortDir) qs.set("sortDir", params.sortDir);
  const query = qs.toString();
  const url = apiUrl(query ? `/api/classes?${query}` : "/api/classes");
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error("LOAD_FAILED");
  return res.json();
}

export async function fetchClassDetail(id: number): Promise<ClassDetail> {
  const res = await fetch(apiUrl(`/api/classes/${id}`), { headers: authHeaders() });
  if (!res.ok) throw new Error("LOAD_FAILED");
  return res.json();
}

export async function createClass(input: ClassInput): Promise<ClassSummary> {
  const res = await fetch(apiUrl("/api/classes"), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("CREATE_FAILED");
  return res.json();
}

export async function updateClass(id: number, input: ClassInput): Promise<ClassSummary> {
  const res = await fetch(apiUrl(`/api/classes/${id}`), {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("UPDATE_FAILED");
  return res.json();
}

export async function setClassActive(id: number, active: boolean): Promise<ClassSummary> {
  const res = await fetch(apiUrl(`/api/classes/${id}/active`), {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ active }),
  });
  if (!res.ok) throw new Error("UPDATE_FAILED");
  return res.json();
}

export async function deleteClass(id: number): Promise<void> {
  const res = await fetch(apiUrl(`/api/classes/${id}`), {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("DELETE_FAILED");
}

export class ClassConflictError extends Error {
  className: string;

  constructor(className: string) {
    super("CLASS_CONFLICT");
    this.name = "ClassConflictError";
    this.className = className;
  }
}

export async function addStudentToClass(classId: number, studentId: number): Promise<ClassDetail> {
  const res = await fetch(apiUrl(`/api/classes/${classId}/students/${studentId}`), {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    if (res.status === 409) {
      const data = await res.json().catch(() => null);
      throw new ClassConflictError(data?.className ?? "");
    }
    throw new Error("ADD_STUDENT_FAILED");
  }
  return res.json();
}

export async function removeStudentFromClass(classId: number, studentId: number): Promise<ClassDetail> {
  const res = await fetch(apiUrl(`/api/classes/${classId}/students/${studentId}`), {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("REMOVE_STUDENT_FAILED");
  return res.json();
}
