import { toast } from "sonner";
import i18n from "../../i18n";
import { notifyAuthChanged } from "../../hooks/useAuth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

let sessionExpired = false;

/**
 * Clears the stored session and tells the app about it, at most once per expiry.
 * Exported for the few callers that can't go through `apiFetch` — the SSE stream
 * reads a long-lived response body itself, so it handles its own 401/403 and must
 * land in the same place instead of quietly retrying a token that's already dead.
 */
export function handleSessionExpired(): void {
  if (sessionExpired) return;
  sessionExpired = true;
  localStorage.removeItem("token");
  localStorage.removeItem("userName");
  localStorage.removeItem("fullName");
  localStorage.removeItem("role");
  notifyAuthChanged();
  toast.error(i18n.t("status.sessionExpired"));
}

export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status === 401 || res.status === 403) {
    handleSessionExpired();
    // Never resolves: the caller just stops here instead of turning this into
    // its own "load failed" toast — the page is about to unmount on redirect anyway.
    return new Promise<Response>(() => {});
  }
  sessionExpired = false;
  return res;
}
