import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CalendarCheck,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  Landmark,
  Users,
  Wallet,
} from "lucide-react";
import AppShell, { type ShellNavItem } from "@/components/AppShell";
import { useScopedDarkMode } from "@/hooks/useScopedDarkMode";
import { useAuth } from "../../hooks/useAuth";

function TeacherLayout() {
  const { isLoggedIn, userName, fullName, role, logout } = useAuth();
  const { t } = useTranslation(["teacher", "common"]);
  useScopedDarkMode();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "TEACHER") {
    return <Navigate to="/" replace />;
  }

  const navItems: ShellNavItem[] = [
    { to: "/admin", end: true, label: t("teacher:nav.overview"), icon: <LayoutDashboard /> },
    { to: "/admin/students", label: t("teacher:nav.students"), icon: <Users /> },
    { to: "/admin/classes", label: t("teacher:nav.classes"), icon: <GraduationCap /> },
    { to: "/admin/attendance", label: t("teacher:nav.attendance"), icon: <CalendarCheck /> },
    { to: "/admin/tuition", label: t("teacher:nav.tuition"), icon: <Wallet /> },
    { to: "/admin/reset-password", label: t("teacher:nav.resetPassword"), icon: <KeyRound /> },
    { to: "/admin/settings", label: t("teacher:nav.settings"), icon: <Landmark /> },
  ];

  return <AppShell navItems={navItems} fullName={fullName} userName={userName} role={role} onLogout={logout} />;
}

export default TeacherLayout;
