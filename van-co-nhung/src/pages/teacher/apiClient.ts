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

export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status === 401 || res.status === 403) {
    if (!sessionExpired) {
      sessionExpired = true;
      localStorage.removeItem("token");
      localStorage.removeItem("userName");
      localStorage.removeItem("fullName");
      localStorage.removeItem("role");
      notifyAuthChanged();
      toast.error(i18n.t("status.sessionExpired"));
    }
    // Never resolves: the caller just stops here instead of turning this into
    // its own "load failed" toast — the page is about to unmount on redirect anyway.
    return new Promise<Response>(() => {});
  }
  sessionExpired = false;
  return res;
}
