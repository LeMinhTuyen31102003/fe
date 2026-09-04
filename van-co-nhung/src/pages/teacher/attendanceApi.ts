import { authHeaders } from "./apiClient";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export interface AttendanceEntry {
  status: AttendanceStatus;
  note: string | null;
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  excused: number;
}

export interface StudentAttendanceRow {
  studentId: number;
  fullName: string;
  entries: Record<string, AttendanceEntry>;
  summary: AttendanceSummary;
}

export interface MonthlyAttendance {
  classId: number;
  className: string;
  year: number;
  month: number;
  sessionDates: string[];
  students: StudentAttendanceRow[];
}

export interface AttendanceMarkInput {
  studentId: number;
  status: AttendanceStatus | null;
  note?: string | null;
}

export async function fetchMonthlyAttendance(
  classId: number,
  year: number,
  month: number,
): Promise<MonthlyAttendance> {
  const res = await fetch(`/api/classes/${classId}/attendance?year=${year}&month=${month}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("LOAD_FAILED");
  return res.json();
}

export async function markAttendance(
  classId: number,
  date: string,
  records: AttendanceMarkInput[],
): Promise<MonthlyAttendance> {
  const res = await fetch(`/api/classes/${classId}/attendance/${date}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ records }),
  });
  if (!res.ok) throw new Error("MARK_FAILED");
  return res.json();
}
