import { authHeaders } from "./apiClient";

export interface BankSettings {
  bankId: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  configured: boolean;
}

export interface BankSettingsInput {
  bankId: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export async function fetchBankSettings(): Promise<BankSettings> {
  const res = await fetch("/api/settings/bank", { headers: authHeaders() });
  if (!res.ok) throw new Error("LOAD_FAILED");
  return res.json();
}

export async function updateBankSettings(input: BankSettingsInput): Promise<BankSettings> {
  const res = await fetch("/api/settings/bank", {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("UPDATE_FAILED");
  return res.json();
}
