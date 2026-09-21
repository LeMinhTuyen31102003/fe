import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useScopedDarkMode } from "@/hooks/useScopedDarkMode";
import { BookOpenCheck, CalendarDays, Home, Wallet } from "lucide-react";
import AppShell, { type ShellNavItem } from "@/components/AppShell";
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

  const navItems: ShellNavItem[] = [
    { to: "/student", end: true, label: t("student:nav.home"), icon: <Home /> },
    { to: "/student/schedule", label: t("student:nav.schedule"), icon: <CalendarDays /> },
    { to: "/student/tuition", label: t("student:nav.tuition"), icon: <Wallet />, badgeCount: unpaidTuitionCount },
    {
      to: "/student/assignments",
      label: t("student:nav.assignments"),
      icon: <BookOpenCheck />,
      badgeCount: pendingAssignmentCount,
    },
  ];

  return <AppShell navItems={navItems} fullName={fullName} userName={userName} role={role} onLogout={logout} />;
}

export default StudentLayout;
