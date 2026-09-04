import { useTranslation } from "react-i18next";

function LanguageToggle() {
  const { i18n, t } = useTranslation("common");
  const nextLanguage = i18n.language === "en" ? "vi" : "en";

  return (
    <button
      type="button"
      onClick={() => i18n.changeLanguage(nextLanguage)}
      aria-label={t("header.toggleLanguage")}
      title={t("header.toggleLanguage")}
      className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full px-2 text-xs font-bold text-muted-foreground outline-none transition-colors hover:bg-cream hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      {i18n.language === "en" ? "EN" : "VI"}
    </button>
  );
}

export default LanguageToggle;
