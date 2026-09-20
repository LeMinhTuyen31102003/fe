import { apiFetch, apiUrl, authHeaders } from "../teacher/apiClient";
import type { AttendanceStatus } from "../teacher/attendanceApi";

export interface MySessionEntry {
  date: string;
  status: AttendanceStatus;
  note: string | null;
}

export interface MyClassAttendance {
  classId: number;
  className: string;
  sessions: MySessionEntry[];
  summary: {
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
}

export interface MyAttendance {
  year: number;
  month: number;
  classes: MyClassAttendance[];
}

export async function fetchMyAttendance(year: number, month: number): Promise<MyAttendance> {
  const res = await apiFetch(apiUrl(`/api/me/attendance?year=${year}&month=${month}`), {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("LOAD_FAILED");
  return res.json();
}
