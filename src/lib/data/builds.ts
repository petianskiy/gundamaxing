import { cache } from "react";
import { db } from "@/lib/db";
import type {
  Build,
  BuildImage,
  CalloutPin,
  BuildLogEntry,
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

const buildInclude = {
  user: {
    select: { id: true, username: true, displayName: true, avatar: true },
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
function toUIBuild(b: any): Build {
  return {
    id: b.id,
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
      (img: { url: string; alt: string; isPrimary: boolean; objectPosition: string | null }): BuildImage => ({
        url: img.url,
        alt: img.alt,
        isPrimary: img.isPrimary,
        objectPosition: img.objectPosition ?? undefined,
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
    username: b.user?.displayName ?? b.user?.username ?? "",
    userAvatar: b.user?.avatar ?? "",
    likes: b.likeCount,
    comments: b.commentCount,
    forkCount: b.forkCount,
    bookmarks: b.bookmarkCount,
    verification: verificationTierMap[b.verification as PrismaVerificationTier],
    createdAt: formatDate(b.createdAt),
    updatedAt: formatDate(b.updatedAt),
  };
}

// ─── Queries ─────────────────────────────────────────────────────

export const getBuilds = cache(async (): Promise<Build[]> => {
  const builds = await db.build.findMany({
    include: buildInclude,
    orderBy: { createdAt: "desc" },
  });

  return builds.map(toUIBuild);
});

export const getBuildById = cache(async (id: string): Promise<Build | null> => {
  const build = await db.build.findUnique({
    where: { id },
    include: buildInclude,
  });

  if (!build) return null;
  return toUIBuild(build);
});

export const getBuildsByUserId = cache(async (userId: string): Promise<Build[]> => {
  const builds = await db.build.findMany({
    where: { userId },
    include: buildInclude,
    orderBy: { createdAt: "desc" },
  });

  return builds.map(toUIBuild);
});
