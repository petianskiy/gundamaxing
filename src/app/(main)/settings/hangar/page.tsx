import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserSettingsData } from "@/lib/data/users";
import { db } from "@/lib/db";
import { HangarSettingsForm } from "./hangar-settings-form";
import { EraManager } from "./era-manager";
import { calculateLevel } from "@/lib/achievements";

export default async function HangarSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [user, builds, eras] = await Promise.all([
    getUserSettingsData(userId),
    db.build.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        kitName: true,
        isFeaturedBuild: true,
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { url: true },
        },
      },
    }),
    db.buildEra.findMany({
      where: { userId },
      orderBy: { order: "asc" },
      include: {
        builds: {
          include: {
            build: {
              select: { id: true, title: true, kitName: true },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    }),
  ]);

  if (!user) redirect("/login");

  const userLevel = calculateLevel(user.xp);
  const featuredBuild = builds.find((b) => b.isFeaturedBuild);

  const simplifiedBuilds = builds.map((b) => ({
    id: b.id,
    title: b.title,
    kitName: b.kitName,
    thumbnail: b.images[0]?.url ?? null,
  }));

  return (
    <div className="space-y-10">
      <HangarSettingsForm
        initialData={{
          hangarTheme: user.hangarTheme ?? "CYBER_BAY",
          hangarLayout: user.hangarLayout ?? "GALLERY",
          manifesto: user.manifesto ?? "",
          accentColor: user.accentColor ?? "#dc2626",
          pinnedBuildIds: user.pinnedBuildIds ?? [],
          featuredBuildId: featuredBuild?.id ?? null,
          domeSettings: {
            selectedBuildIds: (Array.isArray((user.domeSettings as Record<string, unknown>)?.selectedBuildIds)
              ? (user.domeSettings as Record<string, unknown>).selectedBuildIds : []) as string[],
            autoSpin: !!(user.domeSettings as Record<string, unknown>)?.autoSpin,
            spinSpeed: Number((user.domeSettings as Record<string, unknown>)?.spinSpeed) || 1,
            grayscale: !!(user.domeSettings as Record<string, unknown>)?.grayscale,
          },
        }}
        userLevel={userLevel}
        builds={simplifiedBuilds}
      />
      <EraManager initialEras={eras} allBuilds={simplifiedBuilds} />
    </div>
  );
}
