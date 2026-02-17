"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface RoleGuardProps {
  children: React.ReactNode;
  roles: ("USER" | "MODERATOR" | "ADMIN")[];
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, roles, fallback }: RoleGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role && !roles.includes(session.user.role as any)) {
      router.push("/");
    }
  }, [status, session, roles, router]);

  if (status === "loading") {
    return fallback || (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin h-6 w-6 border-2 border-gx-red border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session?.user?.role || !roles.includes(session.user.role as any)) {
    return null;
  }

  return <>{children}</>;
}
