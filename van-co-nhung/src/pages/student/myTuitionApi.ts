import { apiUrl, authHeaders } from "../teacher/apiClient";

export type TuitionStatus = "UNPAID" | "PENDING" | "PAID";

export interface MyClassTuition {
  classId: number;
  className: string;
  feePerSession: number;
  sessionCount: number;
  amount: number;
  status: TuitionStatus;
  requestedAt: string | null;
  paidAt: string | null;
  note: string | null;
}

export interface MyTuition {
  year: number;
  month: number;
  classes: MyClassTuition[];
}

export async function fetchMyTuition(year: number, month: number): Promise<MyTuition> {
  const res = await fetch(apiUrl(`/api/me/tuition?year=${year}&month=${month}`), {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("LOAD_FAILED");
  return res.json();
}

export async function confirmMyPayment(
  classId: number,
  year: number,
  month: number,
): Promise<MyClassTuition> {
  const res = await fetch(
    apiUrl(`/api/me/tuition/${classId}/confirm-payment?year=${year}&month=${month}`),
    {
      method: "PUT",
      headers: authHeaders(),
    },
  );
  if (!res.ok) throw new Error("CONFIRM_FAILED");
  return res.json();
}
