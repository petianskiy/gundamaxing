import { cache } from "react";
import { db } from "@/lib/db";
import { buildInclude, toUIBuild } from "@/lib/data/builds";
import type { HangarData, HangarUser, BuildEra, HangarTheme, HangarLayout } from "@/lib/types";

// ─── Helpers ─────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// ─── Queries ─────────────────────────────────────────────────────

export const getHangarByHandle = cache(async (handle: string): Promise<HangarData | null> => {
  const user = await db.user.findUnique({
    where: { handle: handle.toLowerCase() },
    include: {
      _count: {
        select: {
          badges: true,
          builds: true,
        },
      },
    },
  });

  if (!user) return null;

  // Fetch featured build
  const featuredBuildRaw = await db.build.findFirst({
    where: { userId: user.id, isFeaturedBuild: true },
    include: buildInclude,
  });

  // Fetch eras with their assigned builds (ordered)
  const eras = await db.buildEra.findMany({
    where: { userId: user.id },
    orderBy: { order: "asc" },
    include: {
      builds: {
        orderBy: { order: "asc" },
        include: {
          build: {
            include: buildInclude,
          },
        },
      },
    },
  });

  // Collect all build IDs that are assigned to an era or are the featured build
  const assignedBuildIds = new Set<string>();
  for (const era of eras) {
    for (const assignment of era.builds) {
      assignedBuildIds.add(assignment.buildId);
    }
  }
  if (featuredBuildRaw) {
    assignedBuildIds.add(featuredBuildRaw.id);
  }

  // Fetch latest builds for showcase (most recent, with images)
  const latestBuildsRaw = await db.build.findMany({
    where: { userId: user.id },
    include: buildInclude,
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  // Fetch unassigned builds (not in any era and not featured)
  const unassignedBuildsRaw = await db.build.findMany({
    where: {
      userId: user.id,
      id: { notIn: Array.from(assignedBuildIds) },
    },
    include: buildInclude,
    orderBy: { createdAt: "desc" },
  });

  // Transform user to HangarUser
  const hangarUser: HangarUser = {
    id: user.id,
    handle: user.handle,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    banner: user.banner,
    bio: user.bio,
    accentColor: user.accentColor,
    verificationTier: user.verificationTier,
    level: user.level,
    reputation: user.reputation,
    hangarTheme: user.hangarTheme as HangarTheme,
    hangarLayout: user.hangarLayout as HangarLayout,
    manifesto: user.manifesto,
    socialLinks: (user.socialLinks as Record<string, string>) ?? {},
    isProfilePrivate: user.isProfilePrivate,
    skillLevel: user.skillLevel,
    preferredGrades: user.preferredGrades,
    tools: user.tools,
    techniques: user.techniques,
    country: user.country,
    createdAt: formatDate(user.createdAt),
    buildCount: user._count.builds,
    badgeCount: user._count.badges,
  };

  // Transform eras
  const transformedEras: BuildEra[] = eras.map((era) => ({
    id: era.id,
    name: era.name,
    description: era.description,
    coverImage: era.coverImage,
    order: era.order,
    isCollapsed: era.isCollapsed,
    builds: era.builds.map((assignment) => toUIBuild(assignment.build)),
  }));

  return {
    user: hangarUser,
    featuredBuild: featuredBuildRaw ? toUIBuild(featuredBuildRaw) : null,
    latestBuilds: latestBuildsRaw.map(toUIBuild),
    eras: transformedEras,
    unassignedBuilds: unassignedBuildsRaw.map(toUIBuild),
  };
});
