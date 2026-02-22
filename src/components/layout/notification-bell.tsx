"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { getMyUnreadCount } from "@/lib/actions/notification";

export function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    getMyUnreadCount().then(setCount);
  }, []);

  return (
    <Link
      href="/notifications"
      className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Notifications"
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
      )}
    </Link>
  );
}
