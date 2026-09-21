import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, X } from "lucide-react";
import LanguageToggle from "@/components/LanguageToggle";
import NotificationButton from "@/components/NotificationButton";
import ThemeToggle from "@/components/ThemeToggle";
import UserMenu from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface ShellNavItem {
  to: string;
  label: string;
  end?: boolean;
  icon: ReactNode;
  badgeCount?: number;
}

interface AppShellProps {
  navItems: ShellNavItem[];
  fullName: string | null;
  userName: string | null;
  role: string | null;
  onLogout: () => void;
}

const COLLAPSE_KEY = "sidebarCollapsed";

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

function ChevronRightIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-5">
      <path
        d="M6.1584 3.13508C6.35985 2.94621 6.67627 2.95642 6.86514 3.15788L10.6151 7.15788C10.7954 7.3502 10.7954 7.64949 10.6151 7.84182L6.86514 11.8418C6.67627 12.0433 6.35985 12.0535 6.1584 11.8646C5.95694 11.6757 5.94673 11.3593 6.1356 11.1579L9.565 7.49985L6.1356 3.84182C5.94673 3.64036 5.95694 3.32394 6.1584 3.13508Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-5">
      <path
        d="M8.84182 3.13514C9.04327 3.32401 9.05348 3.64042 8.86462 3.84188L5.43521 7.49991L8.86462 11.1579C9.05348 11.3594 9.04327 11.6758 8.84182 11.8647C8.64036 12.0535 8.32394 12.0433 8.13508 11.8419L4.38508 7.84188C4.20477 7.64955 4.20477 7.35027 4.38508 7.15794L8.13508 3.15794C8.32394 2.95648 8.64036 2.94628 8.84182 3.13514Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );
}

function AppShell({ navItems, fullName, userName, role, onLogout }: AppShellProps) {
  const { t } = useTranslation("common");
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileOpen]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // ignore — preference just won't persist
      }
      return next;
    });
  }

  // On desktop the sidebar can be collapsed to an icon rail; the mobile drawer is always full width.
  function renderNav(rail: boolean, onNavigate?: () => void) {
    return (
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => {
          const link = (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              aria-label={item.label}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-brand-brown-foreground/70 outline-none transition-colors hover:bg-white/10 hover:text-brand-brown-foreground focus-visible:ring-2 focus-visible:ring-primary/60",
                  
                  isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                )
              }
            >
              <span className="shrink-0 [&_svg]:size-5">{item.icon}</span>
              {!rail && <span className="flex-1 truncate">{item.label}</span>}
              {item.badgeCount !== undefined && item.badgeCount > 0 && (
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full bg-status-warning-bg text-[10px] font-semibold text-status-warning-fg",
                    rail && "absolute right-0.5 top-0.5 size-4 text-[9px]",
                  )}
                >
                  {item.badgeCount > 9 ? "9+" : item.badgeCount}
                </span>
              )}
            </NavLink>
          );
          if (!rail) return link;
          return (
            <Tooltip key={item.to}>
              <TooltipTrigger asChild>
                <div>{link}</div>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    );
  }

  const brand = (rail: boolean) => (
    <Link
      to="/"
      className={cn(
        "flex h-10 items-center gap-3 rounded-lg pl-0.5 font-heading text-lg font-bold text-brand-brown-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
      )}
    >
      <img src="/images/logo.jpg" alt={t("appName")} className="size-10 shrink-0 rounded-lg object-cover" />
      {!rail && <span className="truncate">{t("appName")}</span>}
    </Link>
  );

  const collapseButton = (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-10 w-full text-brand-brown-foreground/70 hover:bg-white/10 hover:text-brand-brown-foreground"
          onClick={toggleCollapsed}
          aria-label={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
        >
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{collapsed ? t("sidebar.expand") : t("sidebar.collapse")}</TooltipContent>
    </Tooltip>
  );

  return (
    <div className="flex min-h-screen bg-cream">
      {/* Desktop sidebar (collapsible) */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col gap-6 overflow-hidden bg-brand-brown-dark px-3 py-6 transition-[width] duration-200 lg:flex",
          collapsed ? "w-[68px]" : "w-60",
        )}
      >
        {brand(collapsed)}
        {renderNav(collapsed)}
        {collapseButton}
      </aside>

      {/* Mobile / tablet drawer */}
      <div
        className={cn("fixed inset-0 z-40 lg:hidden", mobileOpen ? "pointer-events-auto" : "pointer-events-none")}
        aria-hidden={!mobileOpen}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity duration-200",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 flex w-64 max-w-[85vw] flex-col gap-6 bg-brand-brown-dark px-3 py-6 shadow-xl transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            {brand(false)}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full text-brand-brown-foreground/70 hover:bg-white/10 hover:text-brand-brown-foreground"
              onClick={() => setMobileOpen(false)}
              aria-label={t("sidebar.close")}
            >
              <X />
            </Button>
          </div>
          {renderNav(false, () => setMobileOpen(false))}
        </aside>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b-2 border-brand-brown/20 bg-background px-4 py-3 sm:px-6 lg:px-10">
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-cream hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label={t("sidebar.open")}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <NotificationButton />
            <UserMenu fullName={fullName} userName={userName} role={role} onLogout={onLogout} />
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppShell;
