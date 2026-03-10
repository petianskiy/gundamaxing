"use client";

import { useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Ban, Undo2, Trash2, Info, Heart, MessageCircle, AtSign, Reply, Bell } from "lucide-react";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/notification";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  actionUrl: string | null;
  read: boolean;
  createdAt: Date;
};

const typeConfig: Record<string, { icon: React.ElementType; color: string }> = {
  WARNING: { icon: AlertTriangle, color: "text-amber-400" },
  BAN: { icon: Ban, color: "text-red-400" },
  UNBAN: { icon: Undo2, color: "text-green-400" },
  CONTENT_DELETED: { icon: Trash2, color: "text-orange-400" },
  SYSTEM: { icon: Info, color: "text-blue-400" },
  LIKE: { icon: Heart, color: "text-pink-400" },
  COMMENT: { icon: MessageCircle, color: "text-sky-400" },
  MENTION: { icon: AtSign, color: "text-purple-400" },
  FORUM_REPLY: { icon: Reply, color: "text-emerald-400" },
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationsList({ notifications }: { notifications: Notification[] }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const hoverTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const timers = hoverTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  };

  const handleClick = (notification: Notification) => {
    if (!notification.read) {
      startTransition(async () => {
        await markNotificationRead(notification.id);
        router.refresh();
      });
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="text-center py-16">
        <Bell className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">{t("empty.allCaughtUp")}</h2>
        <p className="text-sm text-muted-foreground">{t("empty.noNotifications")}</p>
      </div>
    );
  }

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="space-y-3">
      {hasUnread && (
        <div className="flex justify-end">
          <button
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {t("notifications.markAllRead")}
          </button>
        </div>
      )}

      {notifications.map((notification) => {
        const config = typeConfig[notification.type] || typeConfig.SYSTEM;
        const Icon = config.icon;

        return (
          <button
            key={notification.id}
            onClick={() => handleClick(notification)}
            onMouseEnter={() => {
              if (!notification.read) {
                hoverTimers.current[notification.id] = setTimeout(() => {
                  startTransition(async () => {
                    await markNotificationRead(notification.id);
                    router.refresh();
                  });
                }, 700);
              }
            }}
            onMouseLeave={() => {
              if (hoverTimers.current[notification.id]) {
                clearTimeout(hoverTimers.current[notification.id]);
                delete hoverTimers.current[notification.id];
              }
            }}
            className={cn(
              "w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-colors",
              notification.read
                ? "border-border/30 bg-card/50"
                : "border-border/50 bg-card hover:bg-muted/50"
            )}
          >
            <div className={cn("mt-0.5 shrink-0", config.color)}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn("text-sm font-semibold", notification.read ? "text-muted-foreground" : "text-foreground")}>
                  {notification.title}
                </span>
                {!notification.read && (
                  <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                {notification.message}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {timeAgo(notification.createdAt)}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
