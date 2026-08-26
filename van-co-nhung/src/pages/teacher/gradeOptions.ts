export const GRADE_OPTIONS = ["5", "6", "7", "8", "9", "10", "11", "Bổ trợ riêng"];

export function displayGrade(grade: string) {
  return /^\d+$/.test(grade) ? `Lớp ${grade}` : grade;
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
