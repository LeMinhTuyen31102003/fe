import { authHeaders } from "./teacher/apiClient";

export interface MyProfile {
  id: number;
  username: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  role: string;
  active: boolean;
  grade: string | null;
  schoolName: string | null;
  parentName: string | null;
  parentPhone: string | null;
  createdAt: string;
}

export interface UpdateMyProfileInput {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  grade: string;
  schoolName: string;
  parentName: string;
  parentPhone: string;
}

export async function fetchMyProfile(): Promise<MyProfile> {
  const res = await fetch("/api/me/profile", { headers: authHeaders() });
  if (!res.ok) throw new Error("LOAD_FAILED");
  return res.json();
}

export async function updateMyProfile(input: UpdateMyProfileInput): Promise<MyProfile> {
  const res = await fetch("/api/me/profile", {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("UPDATE_FAILED");
  return res.json();
}
