export const BANK_OPTIONS = [
  { id: "MB", name: "MB Bank" },
  { id: "VCB", name: "Vietcombank" },
  { id: "TCB", name: "Techcombank" },
  { id: "ACB", name: "ACB" },
  { id: "BIDV", name: "BIDV" },
  { id: "ICB", name: "VietinBank" },
  { id: "TPB", name: "TPBank" },
  { id: "STB", name: "Sacombank" },
  { id: "VPB", name: "VPBank" },
  { id: "VBA", name: "Agribank" },
];

export function bankNameFromId(bankId: string) {
  return BANK_OPTIONS.find((b) => b.id === bankId)?.name ?? bankId;
}
