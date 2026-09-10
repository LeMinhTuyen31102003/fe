import { useTranslation } from "react-i18next";
import PageBanner from "@/components/PageBanner";
import AttendanceSection from "./AttendanceSection";

function TeacherAttendancePage() {
  const { t } = useTranslation(["teacher", "common"]);

  return (
    <>
      <PageBanner title={t("teacher:nav.attendance")} subtitle={t("teacher:attendance.pageSubtitle")} className="mb-6" />

      <AttendanceSection />
    </>
  );
}

export default TeacherAttendancePage;
