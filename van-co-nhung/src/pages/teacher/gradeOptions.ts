import type { TFunction } from "i18next";

export const GRADE_OPTIONS = ["5", "6", "7", "8", "9", "10", "11", "SUPPLEMENTARY"];

export function displayGrade(grade: string, t: TFunction) {
  if (grade === "SUPPLEMENTARY") return t("teacher:grade.supplementary");
  return /^\d+$/.test(grade) ? t("teacher:grade.prefix", { grade }) : grade;
}

export function compareGrade(a: string, b: string) {
  const na = Number.parseInt(a, 10);
  const nb = Number.parseInt(b, 10);
  const aIsNum = !Number.isNaN(na);
  const bIsNum = !Number.isNaN(nb);
  if (aIsNum && bIsNum) return na - nb;
  if (aIsNum) return -1;
  if (bIsNum) return 1;
  return a.localeCompare(b, "vi");
}
