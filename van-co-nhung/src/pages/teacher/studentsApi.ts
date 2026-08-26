import { authHeaders } from "./apiClient";

export interface StudentClassRef {
  id: number;
  name: string;
}

export interface Student {
  id: number;
  username: string;
  fullName: string;
  grade: string | null;
  schoolName: string | null;
  parentName: string | null;
  parentPhone: string | null;
  active: boolean;
  createdAt: string | null;
  classes: StudentClassRef[];
}

export interface CreateStudentInput {
  username: string;
  password: string;
  fullName: string;
  grade: string;
  schoolName: string;
  parentName: string;
  parentPhone: string;
  active: boolean;
}

export interface UpdateStudentInput {
  fullName: string;
  grade: string;
  schoolName: string;
  parentName: string;
  parentPhone: string;
}

export async function fetchStudents(): Promise<Student[]> {
  const res = await fetch("/api/users/students", { headers: authHeaders() });
  if (!res.ok) throw new Error("LOAD_FAILED");
  return res.json();
}

export async function createStudent(input: CreateStudentInput): Promise<Student> {
  const res = await fetch("/api/users/students", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (res.status === 409) throw new Error("DUPLICATE_USERNAME");
  if (!res.ok) throw new Error("CREATE_FAILED");
  return res.json();
}

export async function updateStudent(id: number, input: UpdateStudentInput): Promise<Student> {
  const res = await fetch(`/api/users/students/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("UPDATE_FAILED");
  return res.json();
}

export async function setStudentActive(id: number, active: boolean): Promise<Student> {
  const res = await fetch(`/api/users/students/${id}/active`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ active }),
  });
  if (!res.ok) throw new Error("UPDATE_FAILED");
  return res.json();
}

export async function deleteStudent(id: number): Promise<void> {
  const res = await fetch(`/api/users/students/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("DELETE_FAILED");
}
