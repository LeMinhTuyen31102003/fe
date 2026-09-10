import { apiFetch, apiUrl, authHeaders } from "./apiClient";

export type AssignmentSubmissionStatus = "PENDING" | "SUBMITTED" | "GRADED";

export interface Assignment {
  id: number;
  classId: number;
  title: string;
  content: string | null;
  dueDate: string | null;
  createdAt: string;
  totalStudents: number;
  submittedCount: number;
  gradedCount: number;
}

export interface AssignmentStudentRow {
  studentId: number;
  fullName: string;
  status: AssignmentSubmissionStatus;
  submittedAt: string | null;
  fileUrl: string | null;
  note: string | null;
}

export interface AssignmentDetail {
  id: number;
  classId: number;
  className: string;
  title: string;
  content: string | null;
  dueDate: string | null;
  createdAt: string;
  students: AssignmentStudentRow[];
}

export interface AssignmentInput {
  title: string;
  content: string;
  dueDate: string | null;
}

export async function fetchAssignments(classId: number): Promise<Assignment[]> {
  const res = await apiFetch(apiUrl(`/api/classes/${classId}/assignments`), { headers: authHeaders() });
  if (!res.ok) throw new Error("LOAD_FAILED");
  return res.json();
}

export async function fetchAssignmentDetail(classId: number, assignmentId: number): Promise<AssignmentDetail> {
  const res = await apiFetch(apiUrl(`/api/classes/${classId}/assignments/${assignmentId}`), {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("LOAD_FAILED");
  return res.json();
}

export async function createAssignment(classId: number, input: AssignmentInput): Promise<Assignment> {
  const res = await apiFetch(apiUrl(`/api/classes/${classId}/assignments`), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("CREATE_FAILED");
  return res.json();
}

export async function updateAssignment(
  classId: number,
  assignmentId: number,
  input: AssignmentInput,
): Promise<Assignment> {
  const res = await apiFetch(apiUrl(`/api/classes/${classId}/assignments/${assignmentId}`), {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("UPDATE_FAILED");
  return res.json();
}

export async function deleteAssignment(classId: number, assignmentId: number): Promise<void> {
  const res = await apiFetch(apiUrl(`/api/classes/${classId}/assignments/${assignmentId}`), {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("DELETE_FAILED");
}

export async function updateSubmissionStatus(
  classId: number,
  assignmentId: number,
  studentId: number,
  status: AssignmentSubmissionStatus,
  note: string,
): Promise<AssignmentDetail> {
  const res = await apiFetch(
    apiUrl(`/api/classes/${classId}/assignments/${assignmentId}/students/${studentId}`),
    {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ status, note }),
    },
  );
  if (!res.ok) throw new Error("UPDATE_FAILED");
  return res.json();
}
