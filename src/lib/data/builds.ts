import { cache } from "react";
import { db } from "@/lib/db";
import type {
  Build,
  BuildImage,
  CalloutPin,
  BuildLogEntry,
  ShowcaseLayout,
  Grade,
  Timeline,
  Scale,
  Technique,
  BuildStatus,
  VerificationTier,
} from "@/lib/types";
import type { BuildStatus as PrismaBuildStatus, VerificationTier as PrismaVerificationTier } from "@prisma/client";

// ─── Enum mappings ───────────────────────────────────────────────

const buildStatusMap: Record<PrismaBuildStatus, BuildStatus> = {
  WIP: "WIP",
  COMPLETED: "Completed",
  ABANDONED: "Abandoned",
};

const verificationTierMap: Record<PrismaVerificationTier, VerificationTier> = {
  UNVERIFIED: "unverified",
  VERIFIED: "verified",
  FEATURED: "featured",
  MASTER: "master",
};

// ─── Helpers ─────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export const buildInclude = {
  user: {
    select: { id: true, username: true, displayName: true, avatar: true, isProfilePrivate: true },
  },
  images: { orderBy: { order: "asc" as const } },
  calloutPins: true,
  buildLog: {
    orderBy: { date: "asc" as const },
  },
  forks: { select: { id: true } },
} as const;

// ─── Transform ───────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toUIBuild(b: any): Build {
  return {
    id: b.id,
    slug: b.slug ?? b.id,
    title: b.title,
    kitName: b.kitName,
    grade: b.grade as Grade,
    timeline: b.timeline as Timeline,
    scale: b.scale as Scale,
    status: buildStatusMap[b.status as PrismaBuildStatus],
    techniques: b.techniques as Technique[],
    paintSystem: b.paintSystem ?? undefined,
    topcoat: b.topcoat ?? undefined,
    timeInvested: b.timeInvested ?? undefined,
    tools: b.tools.length > 0 ? b.tools : undefined,
    intentStatement: b.intentStatement ?? undefined,
    images: (b.images ?? []).map(
      (img: { id: string; url: string; alt: string; isPrimary: boolean; objectPosition: string | null; order: number }): BuildImage => ({
        id: img.id,
        url: img.url,
        alt: img.alt,
        isPrimary: img.isPrimary,
        objectPosition: img.objectPosition ?? undefined,
        order: img.order,
      }),
    ),
    calloutPins: (b.calloutPins ?? []).map(
      (pin: { id: string; x: number; y: number; label: string; description: string }): CalloutPin => ({
        id: pin.id,
        x: pin.x,
        y: pin.y,
        label: pin.label,
        description: pin.description,
      }),
    ),
    buildLog: (b.buildLog ?? []).map(
      (entry: { id: string; date: Date; title: string; content: string; images: string[] }): BuildLogEntry => ({
        id: entry.id,
        date: formatDate(entry.date),
        title: entry.title,
        content: entry.content,
        images: entry.images,
      }),
    ),
    baseKit: b.baseKit ?? undefined,
    inspiredBy: b.inspiredByIds ?? [],
    forks: (b.forks ?? []).map((fork: { id: string }) => fork.id),
    userId: b.userId,
    username: b.user?.displayName || b.user?.username || "",
    userHandle: b.user?.username || "",
    userAvatar: b.user?.avatar ?? "",
    likes: b.likeCount,
    comments: b.commentCount,
    forkCount: b.forkCount,
    bookmarks: b.bookmarkCount,
    respectCount: b.respectCount ?? 0,
    techniqueCount: b.techniqueCount ?? 0,
    creativityCount: b.creativityCount ?? 0,
    commentsEnabled: b.commentsEnabled ?? true,
    verification: verificationTierMap[b.verification as PrismaVerificationTier],
    showcaseLayout: (b.showcaseLayout as ShowcaseLayout | null) ?? undefined,
    createdAt: formatDate(b.createdAt),
    updatedAt: formatDate(b.updatedAt),
  };
}

// ─── Queries ─────────────────────────────────────────────────────

export const getBuilds = cache(async (): Promise<Build[]> => {
  const builds = await db.build.findMany({
    where: {
      user: { isProfilePrivate: false },
    },
    include: buildInclude,
    orderBy: { createdAt: "desc" },
  });

  return builds.map(toUIBuild);
});

export const getBuildOfTheWeek = cache(async (): Promise<Build | null> => {
  // Get the start of the current week (Monday 00:00)
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday is start of week
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - diff);
  weekStart.setHours(0, 0, 0, 0);

  // Find the build with the most likes created this week
  let build = await db.build.findFirst({
    where: {
      createdAt: { gte: weekStart },
      user: { isProfilePrivate: false },
    },
    include: buildInclude,
    orderBy: { likeCount: "desc" },
  });

  // Fallback: if no builds this week, get the overall most-liked build
  if (!build) {
    build = await db.build.findFirst({
      where: {
        user: { isProfilePrivate: false },
      },
      include: buildInclude,
      orderBy: { likeCount: "desc" },
    });
  }

  if (!build) return null;
  return toUIBuild(build);
});

export const getBuildById = cache(async (idOrSlug: string): Promise<Build | null> => {
  // Try slug first, then fall back to id (for backwards-compatible old links)
  let build = await db.build.findUnique({
    where: { slug: idOrSlug },
    include: buildInclude,
  });

  if (!build) {
    build = await db.build.findUnique({
      where: { id: idOrSlug },
      include: buildInclude,
    });
  }

  if (!build) return null;
  return toUIBuild(build);
});

export const getBuildForEdit = cache(async (idOrSlug: string, userId: string) => {
  let build = await db.build.findUnique({
    where: { slug: idOrSlug },
    include: {
      images: { orderBy: { order: "asc" } },
    },
  });

  if (!build) {
    build = await db.build.findUnique({
      where: { id: idOrSlug },
      include: {
        images: { orderBy: { order: "asc" } },
      },
    });
  }

  if (!build) return null;
  if (build.userId !== userId) return null;

  return build;
});

export const getLatestBuilds = cache(async (limit: number = 4): Promise<Build[]> => {
  const builds = await db.build.findMany({
    where: {
      user: { isProfilePrivate: false },
    },
    include: buildInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return builds.map(toUIBuild);
});

export const getOtherBuildsByUser = cache(async (userId: string, excludeBuildId: string): Promise<Build[]> => {
  const builds = await db.build.findMany({
    where: { userId, id: { not: excludeBuildId } },
    include: buildInclude,
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return builds.map(toUIBuild);
});

export const getBuildsByUserId = cache(async (userId: string): Promise<Build[]> => {
  const builds = await db.build.findMany({
    where: { userId },
    include: buildInclude,
    orderBy: { createdAt: "desc" },
  });

  return builds.map(toUIBuild);
});
