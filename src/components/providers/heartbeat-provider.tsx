"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

const HEARTBEAT_INTERVAL = 10 * 60 * 1000; // 10 minutes (was 2 minutes)

export function HeartbeatProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    if (!session?.user) return;

    function sendHeartbeat() {
      if (document.hidden) return; // Skip if tab not visible
      fetch("/api/user/heartbeat", { method: "POST" }).catch(() => {});
    }

    sendHeartbeat();
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    const handleVisibility = () => {
      if (!document.hidden) {
        sendHeartbeat(); // Send on tab refocus
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [session?.user]);

  return <>{children}</>;
}
