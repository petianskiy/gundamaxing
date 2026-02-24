import { cache } from "react";
import { db } from "@/lib/db";
import type { GunplaKitUI, UserKitUI, KitStatus, UserKitReviewUI } from "@/lib/types";

// ─── Helpers ─────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// ─── Queries ─────────────────────────────────────────────────────

export interface KitCatalogFilters {
  search?: string;
  grade?: string;
  series?: string;
  sort?: "name" | "rating" | "owners" | "newest";
  page?: number;
  limit?: number;
}

export const getKitCatalog = cache(
  async (filters: KitCatalogFilters = {}): Promise<{ kits: GunplaKitUI[]; total: number }> => {
    const { search, grade, series, sort = "name", page = 1, limit = 24 } = filters;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { seriesName: { contains: search, mode: "insensitive" } },
      ];
    }
    if (grade) {
      where.grade = grade;
    }
    if (series) {
      where.seriesName = series;
    }

    // Build orderBy based on sort option
    let orderBy: Record<string, string> = { name: "asc" };
    if (sort === "newest") {
      orderBy = { createdAt: "desc" };
    }

    const [kits, total] = await Promise.all([
      db.gunplaKit.findMany({
        where,
        include: {
          userKits: {
            select: {
              overallRating: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.gunplaKit.count({ where }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: GunplaKitUI[] = kits.map((kit: any) => {
      const ratings = kit.userKits
        .map((uk: { overallRating: number | null }) => uk.overallRating)
        .filter((r: number | null): r is number => r !== null);
      const avgRating = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : null;

      return {
        id: kit.id,
        name: kit.name,
        seriesName: kit.seriesName,
        grade: kit.grade,
        scale: kit.scale,
        releaseYear: kit.releaseYear,
        manufacturer: kit.manufacturer,
        imageUrl: kit.imageUrl,
        slug: kit.slug,
        totalOwners: kit.userKits.length,
        avgRating: avgRating !== null ? Math.round(avgRating * 10) / 10 : null,
      };
    });

    // Sort by computed fields if needed
    if (sort === "rating") {
      result.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
    } else if (sort === "owners") {
      result.sort((a, b) => b.totalOwners - a.totalOwners);
    }

    return { kits: result, total };
  }
);

export const getKitBySlug = cache(
  async (slug: string): Promise<{ kit: GunplaKitUI; reviews: UserKitReviewUI[] } | null> => {
    const kit = await db.gunplaKit.findUnique({
      where: { slug },
      include: {
        userKits: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatar: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!kit) return null;

    const ratings = kit.userKits
      .map((uk) => uk.overallRating)
      .filter((r): r is number => r !== null);
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

    const kitUI: GunplaKitUI = {
      id: kit.id,
      name: kit.name,
      seriesName: kit.seriesName,
      grade: kit.grade,
      scale: kit.scale,
      releaseYear: kit.releaseYear,
      manufacturer: kit.manufacturer,
      imageUrl: kit.imageUrl,
      slug: kit.slug,
      totalOwners: kit.userKits.length,
      avgRating: avgRating !== null ? Math.round(avgRating * 10) / 10 : null,
    };

    const reviews: UserKitReviewUI[] = kit.userKits.map((uk) => ({
      id: uk.id,
      userId: uk.userId,
      username: uk.user.displayName || uk.user.username || "",
      userAvatar: uk.user.avatar,
      status: uk.status as KitStatus,
      buildDifficulty: uk.buildDifficulty,
      partQuality: uk.partQuality,
      overallRating: uk.overallRating,
      review: uk.review,
      createdAt: formatDate(uk.createdAt),
    }));

    return { kit: kitUI, reviews };
  }
);

export const getUserCollection = cache(
  async (userId: string): Promise<UserKitUI[]> => {
    const userKits = await db.userKit.findMany({
      where: { userId },
      include: {
        kit: {
          include: {
            userKits: {
              select: { overallRating: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return userKits.map((uk: any) => {
      const ratings = uk.kit.userKits
        .map((r: { overallRating: number | null }) => r.overallRating)
        .filter((r: number | null): r is number => r !== null);
      const avgRating = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : null;

      return {
        id: uk.id,
        kitId: uk.kitId,
        kit: {
          id: uk.kit.id,
          name: uk.kit.name,
          seriesName: uk.kit.seriesName,
          grade: uk.kit.grade,
          scale: uk.kit.scale,
          releaseYear: uk.kit.releaseYear,
          manufacturer: uk.kit.manufacturer,
          imageUrl: uk.kit.imageUrl,
          slug: uk.kit.slug,
          totalOwners: uk.kit.userKits.length,
          avgRating: avgRating !== null ? Math.round(avgRating * 10) / 10 : null,
        },
        status: uk.status as KitStatus,
        buildDifficulty: uk.buildDifficulty,
        partQuality: uk.partQuality,
        overallRating: uk.overallRating,
        review: uk.review,
        createdAt: formatDate(uk.createdAt),
      };
    });
  }
);

export const getUserKitStatus = cache(
  async (userId: string, kitId: string): Promise<{ id: string; status: KitStatus; buildDifficulty: number | null; partQuality: number | null; overallRating: number | null; review: string | null } | null> => {
    const userKit = await db.userKit.findUnique({
      where: { userId_kitId: { userId, kitId } },
    });

    if (!userKit) return null;

    return {
      id: userKit.id,
      status: userKit.status as KitStatus,
      buildDifficulty: userKit.buildDifficulty,
      partQuality: userKit.partQuality,
      overallRating: userKit.overallRating,
      review: userKit.review,
    };
  }
);

export const getDistinctSeries = cache(async (): Promise<string[]> => {
  const result = await db.gunplaKit.findMany({
    select: { seriesName: true },
    distinct: ["seriesName"],
    orderBy: { seriesName: "asc" },
  });
  return result.map((r) => r.seriesName);
});

export const getDistinctGrades = cache(async (): Promise<string[]> => {
  const result = await db.gunplaKit.findMany({
    select: { grade: true },
    distinct: ["grade"],
    orderBy: { grade: "asc" },
  });
  return result.map((r) => r.grade);
});
