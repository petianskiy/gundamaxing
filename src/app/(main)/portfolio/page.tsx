import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getBuildsByUserId } from "@/lib/data/builds";
import { getPortfolioStats } from "@/lib/data/users";
import { PortfolioDashboard } from "./components/portfolio-dashboard";

export const metadata = {
  title: "My Portfolio | Gundamaxing",
};

export default async function PortfolioPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [builds, stats] = await Promise.all([
    getBuildsByUserId(session.user.id),
    getPortfolioStats(session.user.id),
  ]);

  // Get pinned build IDs from user
  const { db } = await import("@/lib/db");
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { pinnedBuildIds: true, handle: true, displayName: true, username: true },
  });

  return (
    <PortfolioDashboard
      builds={builds}
      stats={stats}
      pinnedBuildIds={(user?.pinnedBuildIds as string[]) ?? []}
      handle={user?.handle ?? ""}
      displayName={user?.displayName ?? user?.username ?? ""}
    />
  );
}
