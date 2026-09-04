import { Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function NotificationButton() {
  const { t } = useTranslation("common");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-cream hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
        aria-label={t("header.notifications")}
      >
        <Bell className="h-5 w-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>{t("header.notifications")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <p className="px-2 py-6 text-center text-sm text-muted-foreground">{t("header.noNotifications")}</p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationButton;
