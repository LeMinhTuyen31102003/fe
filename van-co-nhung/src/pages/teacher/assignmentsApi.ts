import { apiFetch, apiUrl, authHeaders } from "./apiClient";

export type AssignmentSubmissionStatus = "PENDING" | "SUBMITTED" | "GRADED";

export interface Assignment {
  id: number;
  classId: number;
  title: string;
  content: string | null;
  dueDate: string | null;
  createdAt: string;
  attachmentUrl: string | null;
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
  score: number | null;
}

export interface AssignmentDetail {
  id: number;
  classId: number;
  className: string;
  title: string;
  content: string | null;
  dueDate: string | null;
  createdAt: string;
  attachmentUrl: string | null;
  students: AssignmentStudentRow[];
}

export interface AssignmentInput {
  title: string;
  content: string;
  dueDate: string | null;
  attachmentUrl: string | null;
  attachmentPublicId: string | null;
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

export interface UploadedAssignmentFile {
  url: string;
  publicId: string;
}

export async function uploadAssignmentAttachment(classId: number, file: File): Promise<UploadedAssignmentFile> {
  const formData = new FormData();
  formData.append("file", file);

  // Deliberately not authHeaders() here — it forces Content-Type: application/json,
  // which would stop the browser from setting the multipart boundary itself.
  const token = localStorage.getItem("token");
  const res = await apiFetch(apiUrl(`/api/classes/${classId}/assignments/attachment`), {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) throw new Error("UPLOAD_FAILED");
  const data: { fileUrl: string; filePublicId: string } = await res.json();
  return { url: data.fileUrl, publicId: data.filePublicId };
}

export async function deleteAssignment(classId: number, assignmentId: number): Promise<void> {
  const res = await apiFetch(apiUrl(`/api/classes/${classId}/assignments/${assignmentId}`), {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("DELETE_FAILED");
}

// Status is no longer settable directly — the backend derives PENDING/SUBMITTED/GRADED
// from whether a score is present (see AssignmentController.updateSubmission).
export async function updateSubmissionFeedback(
  classId: number,
  assignmentId: number,
  studentId: number,
  note: string,
  score: number | null,
): Promise<AssignmentDetail> {
  const res = await apiFetch(
    apiUrl(`/api/classes/${classId}/assignments/${assignmentId}/students/${studentId}`),
    {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ note, score }),
    },
  );
  if (!res.ok) throw new Error("UPDATE_FAILED");
  return res.json();
}
