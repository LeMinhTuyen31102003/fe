import { useTranslation } from "react-i18next";
import AttendanceSection from "./AttendanceSection";

function TeacherAttendancePage() {
  const { t } = useTranslation(["teacher", "common"]);

  return (
    <>
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">{t("teacher:nav.attendance")}</h1>
        <p className="text-muted-foreground">{t("teacher:attendance.pageSubtitle")}</p>
      </header>

      <AttendanceSection />
    </>
  );
}

export default TeacherAttendancePage;
