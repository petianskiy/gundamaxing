"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { getMyUnreadCount } from "@/lib/actions/notification";

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes (was 30 seconds)

export function NotificationBell() {
  const [count, setCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const refresh = useCallback(() => {
    getMyUnreadCount().then(setCount).catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, POLL_INTERVAL);

    // Pause polling when tab is not visible
    const handleVisibility = () => {
      if (document.hidden) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        refresh();
        intervalRef.current = setInterval(refresh, POLL_INTERVAL);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refresh]);

  return (
    <Link
      href="/notifications"
      className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
      aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ""}`}
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold ring-2 ring-background">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
