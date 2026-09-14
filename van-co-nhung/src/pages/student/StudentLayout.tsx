import { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageToggle from "@/components/LanguageToggle";
import NotificationButton from "@/components/NotificationButton";
import ThemeToggle from "@/components/ThemeToggle";
import UserMenu from "@/components/UserMenu";
import { useScopedDarkMode } from "@/hooks/useScopedDarkMode";
import { cn } from "@/lib/utils";
import { useAuth } from "../../hooks/useAuth";
import { onAppEvent } from "@/eventStream";
import { fetchMyPendingAssignmentCount } from "./myAssignmentsApi";
import { fetchMyUnpaidTuitionCount } from "./myTuitionApi";

function StudentLayout() {
  const { isLoggedIn, userName, fullName, role, logout } = useAuth();
  const { t } = useTranslation(["student", "common"]);
  useScopedDarkMode();
  const [pendingAssignmentCount, setPendingAssignmentCount] = useState(0);
  const [unpaidTuitionCount, setUnpaidTuitionCount] = useState(0);

  useEffect(() => {
    if (!isLoggedIn || role !== "STUDENT") return;
    let cancelled = false;
    function poll() {
      fetchMyPendingAssignmentCount()
        .then((count) => {
          if (!cancelled) setPendingAssignmentCount(count);
        })
        .catch(() => {});
    }
    const unsubscribe = onAppEvent((scope) => {
      if (scope === "assignment") poll();
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [isLoggedIn, role]);

  useEffect(() => {
    if (!isLoggedIn || role !== "STUDENT") return;
    let cancelled = false;
    function poll() {
      fetchMyUnpaidTuitionCount()
        .then((count) => {
          if (!cancelled) setUnpaidTuitionCount(count);
        })
        .catch(() => {});
    }
    const unsubscribe = onAppEvent((scope) => {
      if (scope === "tuition") poll();
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [isLoggedIn, role]);

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
            to="/student/tuition"
            className={({ isActive }) =>
              cn(
                "flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-cream hover:text-foreground",
                isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              )
            }
          >
            <span>{t("student:nav.tuition")}</span>
            {unpaidTuitionCount > 0 && (
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-semibold text-amber-800">
                {unpaidTuitionCount > 9 ? "9+" : unpaidTuitionCount}
              </span>
            )}
          </NavLink>
          <NavLink
            to="/student/assignments"
            className={({ isActive }) =>
              cn(
                "flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-cream hover:text-foreground",
                isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              )
            }
          >
            <span>{t("student:nav.assignments")}</span>
            {pendingAssignmentCount > 0 && (
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-semibold text-amber-800">
                {pendingAssignmentCount > 9 ? "9+" : pendingAssignmentCount}
              </span>
            )}
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
