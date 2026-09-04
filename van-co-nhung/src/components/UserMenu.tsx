import { LogOut, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initialsFrom } from "@/lib/utils";

const ROLE_PROFILE_PATH: Record<string, string> = {
  TEACHER: "/admin/profile",
  STUDENT: "/student/profile",
};

interface UserMenuProps {
  fullName: string | null;
  userName: string | null;
  role: string | null;
  onLogout: () => void;
}

function UserMenu({ fullName, userName, role, onLogout }: UserMenuProps) {
  const { t } = useTranslation("common");
  const displayName = fullName || userName || t("genericUser");
  const profilePath = (role && ROLE_PROFILE_PATH[role]) || "/";
  const roleLabel = role ? t(`role.${role}`, { defaultValue: role }) : "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/50">
        {initialsFrom(displayName)}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="truncate text-sm font-semibold text-foreground">{displayName}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">{roleLabel}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={profilePath} className="cursor-pointer">
            <UserRound className="h-4 w-4" />
            {t("header.profileInfo")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onLogout} className="cursor-pointer">
          <LogOut className="h-4 w-4" />
          {t("actions.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserMenu;
