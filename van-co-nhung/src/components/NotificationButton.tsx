import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { connectEventStream, onAppEvent } from "@/eventStream";
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/notificationsApi";

function formatCurrency(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

function formatDateTime(value: string, language: string) {
  return new Date(value).toLocaleString(language === "en" ? "en-US" : "vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildMessage(n: AppNotification, t: TFunction): string {
  switch (n.type) {
    case "TUITION_PAYMENT_REQUESTED":
      return t("header.notificationTypes.tuitionPaymentRequested", {
        studentName: n.studentName,
        className: n.className,
        amount: n.amount != null ? formatCurrency(n.amount) : "",
      });
    case "TUITION_FINALIZED":
      return t("header.notificationTypes.tuitionFinalized", {
        className: n.className,
        month: n.month,
        year: n.year,
      });
    case "ASSIGNMENT_CREATED":
      return t("header.notificationTypes.assignmentCreated", {
        title: n.assignmentTitle,
        className: n.className,
      });
    case "ASSIGNMENT_FULLY_SUBMITTED":
      return t("header.notificationTypes.assignmentFullySubmitted", {
        title: n.assignmentTitle,
        className: n.className,
      });
    default:
      return "";
  }
}

function notificationTarget(n: AppNotification): string {
  switch (n.type) {
    case "TUITION_PAYMENT_REQUESTED":
      return "/admin/tuition";
    case "TUITION_FINALIZED":
      return "/student/tuition";
    case "ASSIGNMENT_CREATED":
      return "/student/assignments";
    case "ASSIGNMENT_FULLY_SUBMITTED":
      return n.classId ? `/admin/classes/${n.classId}?tab=assignments` : "/admin/classes";
    default:
      return "#";
  }
}

function NotificationButton() {
  const { t, i18n } = useTranslation("common");
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    let cancelled = false;
    function poll() {
      fetchUnreadNotificationCount()
        .then((count) => {
          if (!cancelled) setUnreadCount(count);
        })
        .catch(() => {});
    }
    function refreshList() {
      fetchNotifications()
        .then((data) => {
          if (!cancelled) setNotifications(data);
        })
        .catch(() => {});
    }
    connectEventStream();
    const unsubscribe = onAppEvent((scope) => {
      if (scope !== "notification") return;
      poll();
      if (openRef.current) refreshList();
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setIsLoading(true);
      fetchNotifications()
        .then(setNotifications)
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }

  function handleSelect(n: AppNotification) {
    if (!n.read) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      markNotificationRead(n.id).catch(() => {});
    }
    navigate(notificationTarget(n));
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
      // best-effort; the next SSE event will resync the real count
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-cream hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
        aria-label={t("header.notifications")}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-status-warning-bg text-[10px] font-semibold text-status-warning-fg">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80" onCloseAutoFocus={(e) => e.preventDefault()}>
        <div className="flex items-center justify-between px-2 py-1">
          <DropdownMenuLabel className="p-0">{t("header.notifications")}</DropdownMenuLabel>
          {unreadCount > 0 && (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-dark underline-offset-4 hover:underline"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="size-3.5" />
              {t("header.markAllRead")}
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">{t("status.loading")}</p>
          ) : notifications.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">{t("header.noNotifications")}</p>
          ) : (
            // Unread first, read pushed down — a stable sort so each group keeps the
            // API's createdAt-desc order (newest first) within itself.
            [...notifications]
              .sort((a, b) => Number(a.read) - Number(b.read))
              .map((n) => (
              <DropdownMenuItem
                key={n.id}
                className="flex-col items-start gap-0.5 whitespace-normal"
                onSelect={() => handleSelect(n)}
              >
                <div className="flex w-full items-start gap-2">
                  {!n.read && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-dark" />}
                  <span className={cn("text-sm", n.read ? "text-muted-foreground" : "font-medium text-foreground")}>
                    {buildMessage(n, t)}
                  </span>
                </div>
                <span className="pl-3.5 text-[11px] text-muted-foreground">
                  {formatDateTime(n.createdAt, i18n.language)}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationButton;
