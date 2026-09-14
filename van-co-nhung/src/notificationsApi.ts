import { apiFetch, apiUrl, authHeaders } from "./pages/teacher/apiClient";

export type NotificationType =
  | "TUITION_PAYMENT_REQUESTED"
  | "TUITION_FINALIZED"
  | "ASSIGNMENT_CREATED"
  | "ASSIGNMENT_FULLY_SUBMITTED";

export interface AppNotification {
  id: number;
  type: NotificationType;
  classId: number | null;
  className: string | null;
  studentId: number | null;
  studentName: string | null;
  assignmentId: number | null;
  assignmentTitle: string | null;
  amount: number | null;
  year: number | null;
  month: number | null;
  read: boolean;
  createdAt: string;
}

export async function fetchNotifications(): Promise<AppNotification[]> {
  const res = await apiFetch(apiUrl("/api/notifications"), { headers: authHeaders() });
  if (!res.ok) throw new Error("LOAD_FAILED");
  return res.json();
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const res = await apiFetch(apiUrl("/api/notifications/unread-count"), { headers: authHeaders() });
  if (!res.ok) throw new Error("LOAD_FAILED");
  const data: { count: number } = await res.json();
  return data.count;
}

export async function markNotificationRead(id: number): Promise<void> {
  const res = await apiFetch(apiUrl(`/api/notifications/${id}/read`), {
    method: "PUT",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("UPDATE_FAILED");
}

export async function markAllNotificationsRead(): Promise<void> {
  const res = await apiFetch(apiUrl("/api/notifications/read-all"), {
    method: "PUT",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("UPDATE_FAILED");
}
