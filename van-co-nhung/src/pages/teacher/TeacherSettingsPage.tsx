import { useTranslation } from "react-i18next";
import BankSettingsSection from "./BankSettingsSection";

function TeacherSettingsPage() {
  const { t } = useTranslation(["teacher", "common"]);

  return (
    <>
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">{t("teacher:settings.pageTitle")}</h1>
        <p className="text-muted-foreground">{t("teacher:settings.pageSubtitle")}</p>
      </header>

      <BankSettingsSection />
    </>
  );
}

export default TeacherSettingsPage;
