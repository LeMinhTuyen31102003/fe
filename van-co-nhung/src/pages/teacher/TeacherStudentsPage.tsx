import { useTranslation } from "react-i18next";
import StudentsSection from "./StudentsSection";

function TeacherStudentsPage() {
  const { t } = useTranslation(["teacher", "common"]);

  return (
    <>
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">{t("teacher:students.pageTitle")}</h1>
        <p className="text-muted-foreground">{t("teacher:students.pageSubtitle")}</p>
      </header>

      <StudentsSection />
    </>
  );
}

export default TeacherStudentsPage;
