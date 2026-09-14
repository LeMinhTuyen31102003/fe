import { apiFetch, apiUrl, authHeaders } from "../teacher/apiClient";
import type { AssignmentSubmissionStatus } from "../teacher/assignmentsApi";

export interface MyAssignment {
  id: number;
  classId: number;
  className: string;
  title: string;
  content: string | null;
  dueDate: string | null;
  createdAt: string;
  attachmentUrl: string | null;
  status: AssignmentSubmissionStatus;
  submittedAt: string | null;
  fileUrl: string | null;
  note: string | null;
  score: number | null;
  locked: boolean;
}

export async function fetchMyAssignments(): Promise<MyAssignment[]> {
  const res = await apiFetch(apiUrl("/api/me/assignments"), { headers: authHeaders() });
  if (!res.ok) throw new Error("LOAD_FAILED");
  return res.json();
}

export async function submitMyAssignment(
  assignmentId: number,
  fileUrl: string,
  filePublicId: string,
): Promise<MyAssignment> {
  const res = await apiFetch(apiUrl(`/api/me/assignments/${assignmentId}/submit`), {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ fileUrl, filePublicId }),
  });
  if (!res.ok) throw new Error("SUBMIT_FAILED");
  return res.json();
}

export async function fetchMyPendingAssignmentCount(): Promise<number> {
  const res = await apiFetch(apiUrl("/api/me/assignments/pending-count"), { headers: authHeaders() });
  if (!res.ok) throw new Error("LOAD_FAILED");
  const data: { count: number } = await res.json();
  return data.count;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const COMPRESS_MAX_DIMENSION = 1600;
const COMPRESS_JPEG_QUALITY = 0.8;
const COMPRESS_SKIP_UNDER_BYTES = 500 * 1024;

// Phone camera photos are often 3000-4000px and several MB — way more than
// needed to read handwritten text. Resizing + re-encoding client-side before
// upload keeps long-term server disk usage low. Falls back to the
// original file on any failure (e.g. HEIC isn't decodable via canvas on
// non-Safari browsers) so a compression hiccup never blocks a submission.
async function compressImage(file: File): Promise<File> {
  if (file.size <= COMPRESS_SKIP_UNDER_BYTES || !file.type.startsWith("image/")) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, COMPRESS_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", COMPRESS_JPEG_QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export interface UploadedFile {
  url: string;
  publicId: string;
}

export async function uploadSubmissionFile(assignmentId: number, file: File): Promise<UploadedFile> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("FILE_TOO_LARGE");
  }

  const uploadFile = await compressImage(file);

  const formData = new FormData();
  formData.append("file", uploadFile);

  // Deliberately not authHeaders() here — it forces Content-Type: application/json,
  // which would stop the browser from setting the multipart boundary itself.
  const token = localStorage.getItem("token");
  const res = await apiFetch(apiUrl(`/api/me/assignments/${assignmentId}/submission-file`), {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) throw new Error("UPLOAD_FAILED");
  const data: { fileUrl: string; filePublicId: string } = await res.json();
  return { url: data.fileUrl, publicId: data.filePublicId };
}
