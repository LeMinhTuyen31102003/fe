import { useTranslation } from "react-i18next";
import PageBanner from "@/components/PageBanner";
import ClassesSection from "./ClassesSection";

function TeacherClassesPage() {
  const { t } = useTranslation(["teacher", "common"]);

  return (
    <>
      <PageBanner title={t("teacher:classes.pageTitle")} subtitle={t("teacher:classes.pageSubtitle")} className="mb-6" />

      <ClassesSection />
    </>
  );
}

export default TeacherClassesPage;
