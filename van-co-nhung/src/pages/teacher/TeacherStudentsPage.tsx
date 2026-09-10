import { useTranslation } from "react-i18next";
import PageBanner from "@/components/PageBanner";
import StudentsSection from "./StudentsSection";

function TeacherStudentsPage() {
  const { t } = useTranslation(["teacher", "common"]);

  return (
    <>
      <PageBanner title={t("teacher:students.pageTitle")} subtitle={t("teacher:students.pageSubtitle")} className="mb-6" />

      <StudentsSection />
    </>
  );
}

export default TeacherStudentsPage;
