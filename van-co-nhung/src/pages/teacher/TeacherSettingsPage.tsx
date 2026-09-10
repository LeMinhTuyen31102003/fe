import { useTranslation } from "react-i18next";
import PageBanner from "@/components/PageBanner";
import BankSettingsSection from "./BankSettingsSection";

function TeacherSettingsPage() {
  const { t } = useTranslation(["teacher", "common"]);

  return (
    <>
      <PageBanner title={t("teacher:settings.pageTitle")} subtitle={t("teacher:settings.pageSubtitle")} className="mb-6" />

      <BankSettingsSection />
    </>
  );
}

export default TeacherSettingsPage;
