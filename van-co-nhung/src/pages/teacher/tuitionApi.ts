import { apiUrl, authHeaders } from "./apiClient";

export type TuitionStatus = "UNPAID" | "PENDING" | "PAID";

export interface StudentTuitionRow {
  studentId: number;
  fullName: string;
  sessionCount: number;
  amount: number;
  status: TuitionStatus;
  requestedAt: string | null;
  paidAt: string | null;
  note: string | null;
}

export interface TuitionSummary {
  totalStudents: number;
  paidCount: number;
  pendingCount: number;
  totalDue: number;
  totalCollected: number;
  totalOutstanding: number;
}

export interface MonthlyTuition {
  classId: number;
  className: string;
  feePerSession: number | null;
  year: number;
  month: number;
  students: StudentTuitionRow[];
  summary: TuitionSummary;
}

export interface TuitionUpdateInput {
  amount: number;
  status: TuitionStatus;
  note: string | null;
}

export async function fetchMonthlyTuition(
  classId: number,
  year: number,
  month: number,
): Promise<MonthlyTuition> {
  const res = await fetch(apiUrl(`/api/classes/${classId}/tuition?year=${year}&month=${month}`), {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("LOAD_FAILED");
  return res.json();
}

export async function updateTuition(
  classId: number,
  studentId: number,
  year: number,
  month: number,
  input: TuitionUpdateInput,
): Promise<MonthlyTuition> {
  const res = await fetch(
    apiUrl(`/api/classes/${classId}/tuition/${studentId}?year=${year}&month=${month}`),
    {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(input),
    },
  );
  if (!res.ok) throw new Error("UPDATE_FAILED");
  return res.json();
}
