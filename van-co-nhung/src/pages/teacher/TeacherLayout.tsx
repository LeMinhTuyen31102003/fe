import { Link, NavLink, Navigate, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "../../hooks/useAuth";

function TeacherLayout() {
  const { isLoggedIn, userName, role, logout } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "TEACHER") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen bg-cream">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col gap-6 border-r border-border bg-background p-6">
        <Link to="/" className="flex items-center gap-2.5 font-heading text-lg font-bold text-foreground">
          <img src="/images/logo.jpg" alt="Văn Cô Nhung" className="h-9 w-auto rounded-lg" />
          <span>Văn Cô Nhung</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              cn(
                "rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-cream hover:text-foreground",
                isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              )
            }
          >
            Tổng quan
          </NavLink>
          <NavLink
            to="/admin/students"
            className={({ isActive }) =>
              cn(
                "rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-cream hover:text-foreground",
                isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              )
            }
          >
            Học sinh
          </NavLink>
          <NavLink
            to="/admin/classes"
            className={({ isActive }) =>
              cn(
                "rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-cream hover:text-foreground",
                isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              )
            }
          >
            Lớp học
          </NavLink>
          <span
            className="cursor-not-allowed rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground/40"
            title="Sắp ra mắt"
          >
            Điểm danh
          </span>
          <span
            className="cursor-not-allowed rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground/40"
            title="Sắp ra mắt"
          >
            Học phí
          </span>
        </nav>

        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <div className="text-sm font-semibold text-muted-foreground">{userName}</div>
          <Button type="button" variant="outline" onClick={logout}>
            Đăng xuất
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-8 md:p-10">
        <Outlet />
      </main>
    </div>
  );
}

export default TeacherLayout;
