"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

export function BanGuard({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (session?.user?.isBanned && pathname !== "/banned") {
      router.replace("/banned");
    }
  }, [session?.user?.isBanned, pathname, router]);

  return <>{children}</>;
}
