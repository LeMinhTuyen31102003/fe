import { Link, NavLink, Navigate, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageToggle from "@/components/LanguageToggle";
import NotificationButton from "@/components/NotificationButton";
import ThemeToggle from "@/components/ThemeToggle";
import UserMenu from "@/components/UserMenu";
import { useScopedDarkMode } from "@/hooks/useScopedDarkMode";
import { cn } from "@/lib/utils";
import { useAuth } from "../../hooks/useAuth";

function StudentLayout() {
  const { isLoggedIn, userName, fullName, role, logout } = useAuth();
  const { t } = useTranslation(["student", "common"]);
  useScopedDarkMode();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "STUDENT") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen bg-cream">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col gap-6 border-r border-border bg-background p-6">
        <Link to="/" className="flex items-center gap-2.5 font-heading text-lg font-bold text-foreground">
          <img src="/images/logo.jpg" alt={t("common:appName")} className="h-9 w-auto rounded-lg" />
          <span>{t("common:appName")}</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          <NavLink
            to="/student"
            end
            className={({ isActive }) =>
              cn(
                "rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-cream hover:text-foreground",
                isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              )
            }
          >
            {t("student:nav.home")}
          </NavLink>
          <NavLink
            to="/student/schedule"
            className={({ isActive }) =>
              cn(
                "rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-cream hover:text-foreground",
                isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              )
            }
          >
            {t("student:nav.schedule")}
          </NavLink>
          <NavLink
            to="/student/class"
            className={({ isActive }) =>
              cn(
                "rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-cream hover:text-foreground",
                isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              )
            }
          >
            {t("student:nav.class")}
          </NavLink>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-end gap-2 border-b border-border bg-background px-8 py-3 md:px-10">
          <LanguageToggle />
          <ThemeToggle />
          <NotificationButton />
          <UserMenu fullName={fullName} userName={userName} role={role} onLogout={logout} />
        </header>

        <main className="flex-1 p-8 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default StudentLayout;
