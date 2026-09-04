import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation("common");

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={t("header.toggleTheme")}
      title={theme === "dark" ? t("header.themeLight") : t("header.themeDark")}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-cream hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

export default ThemeToggle;
