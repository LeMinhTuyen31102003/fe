import { useTranslation } from "react-i18next";
import ClassesSection from "./ClassesSection";

function TeacherClassesPage() {
  const { t } = useTranslation(["teacher", "common"]);

  return (
    <>
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">{t("teacher:classes.pageTitle")}</h1>
        <p className="text-muted-foreground">{t("teacher:classes.pageSubtitle")}</p>
      </header>

      <ClassesSection />
    </>
  );
}

export default TeacherClassesPage;
