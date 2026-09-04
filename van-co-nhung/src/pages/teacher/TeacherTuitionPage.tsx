import { useTranslation } from "react-i18next";
import TuitionSection from "./TuitionSection";

function TeacherTuitionPage() {
  const { t } = useTranslation(["teacher", "common"]);

  return (
    <>
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">{t("teacher:nav.tuition")}</h1>
        <p className="text-muted-foreground">{t("teacher:tuition.pageSubtitle")}</p>
      </header>

      <TuitionSection />
    </>
  );
}

export default TeacherTuitionPage;
