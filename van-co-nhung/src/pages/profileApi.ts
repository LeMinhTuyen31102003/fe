import { apiFetch, apiUrl, authHeaders } from "./teacher/apiClient";

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
  const res = await apiFetch(apiUrl("/api/me/profile"), { headers: authHeaders() });
  if (!res.ok) throw new Error("LOAD_FAILED");
  return res.json();
}

export async function updateMyProfile(input: UpdateMyProfileInput): Promise<MyProfile> {
  const res = await apiFetch(apiUrl("/api/me/profile"), {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("UPDATE_FAILED");
  return res.json();
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export class WrongCurrentPasswordError extends Error {
  constructor() {
    super("WRONG_CURRENT_PASSWORD");
    this.name = "WrongCurrentPasswordError";
  }
}

export async function changeMyPassword(input: ChangePasswordInput): Promise<void> {
  const res = await apiFetch(apiUrl("/api/me/password"), {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    if (res.status === 400) throw new WrongCurrentPasswordError();
    throw new Error("CHANGE_PASSWORD_FAILED");
  }
}
