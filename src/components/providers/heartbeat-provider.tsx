"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

const HEARTBEAT_INTERVAL = 2 * 60 * 1000; // 2 minutes

export function HeartbeatProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user) return;

    function sendHeartbeat() {
      fetch("/api/user/heartbeat", { method: "POST" }).catch(() => {});
    }

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
    return () => clearInterval(interval);
  }, [session?.user]);

  return <>{children}</>;
}
