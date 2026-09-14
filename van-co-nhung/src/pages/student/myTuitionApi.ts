import { apiFetch, apiUrl, authHeaders } from "../teacher/apiClient";

export type TuitionStatus = "UNPAID" | "PENDING" | "PAID";

export interface MyClassTuition {
  classId: number;
  className: string;
  feePerSession: number;
  sessionCount: number;
  amount: number;
  classFund: number;
  totalAmount: number;
  status: TuitionStatus;
  requestedAt: string | null;
  paidAt: string | null;
  note: string | null;
  finalized: boolean;
}

export interface MyTuition {
  year: number;
  month: number;
  classes: MyClassTuition[];
}

export interface MyTuitionHistoryEntry {
  year: number;
  month: number;
  classId: number;
  className: string;
  feePerSession: number;
  sessionCount: number;
  amount: number;
  classFund: number;
  totalAmount: number;
  status: TuitionStatus;
  requestedAt: string | null;
  paidAt: string | null;
  note: string | null;
}

export interface MyTuitionHistory {
  entries: MyTuitionHistoryEntry[];
}

export async function fetchMyTuition(year: number, month: number): Promise<MyTuition> {
  const res = await apiFetch(apiUrl(`/api/me/tuition?year=${year}&month=${month}`), {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("LOAD_FAILED");
  return res.json();
}

export async function fetchMyTuitionHistory(): Promise<MyTuitionHistory> {
  const res = await apiFetch(apiUrl("/api/me/tuition/history"), {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("LOAD_FAILED");
  return res.json();
}

export async function fetchMyUnpaidTuitionCount(): Promise<number> {
  const res = await apiFetch(apiUrl("/api/me/tuition/unpaid-count"), {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("LOAD_FAILED");
  const data: { count: number } = await res.json();
  return data.count;
}

export async function confirmMyPayment(
  classId: number,
  year: number,
  month: number,
): Promise<MyClassTuition> {
  const res = await apiFetch(
    apiUrl(`/api/me/tuition/${classId}/confirm-payment?year=${year}&month=${month}`),
    {
      method: "PUT",
      headers: authHeaders(),
    },
  );
  if (!res.ok) throw new Error("CONFIRM_FAILED");
  return res.json();
}
