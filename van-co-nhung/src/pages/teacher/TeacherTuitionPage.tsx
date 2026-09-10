import { useTranslation } from "react-i18next";
import PageBanner from "@/components/PageBanner";
import TuitionSection from "./TuitionSection";

function TeacherTuitionPage() {
  const { t } = useTranslation(["teacher", "common"]);

  return (
    <>
      <PageBanner title={t("teacher:nav.tuition")} subtitle={t("teacher:tuition.pageSubtitle")} className="mb-6" />

      <TuitionSection />
    </>
  );
}

export default TeacherTuitionPage;
