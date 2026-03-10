import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { BannedScreen } from "./banned-screen";

export default async function BannedPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { riskScore: true, banReason: true, bannedAt: true },
  });

  // If not actually banned, redirect home
  if (!user || user.riskScore < 100) {
    redirect("/");
  }

  return (
    <BannedScreen
      reason={user.banReason ?? "Your account has been suspended for violating community guidelines."}
      bannedAt={user.bannedAt?.toISOString() ?? null}
    />
  );
}
