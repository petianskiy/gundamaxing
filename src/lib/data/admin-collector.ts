import { cache } from "react";
import { db } from "@/lib/db";
import { toCdnUrl } from "@/lib/upload/cdn";
import type { AdminGunplaKitUI, GundamSeriesUI, KitSuggestionUI, KitCategory, SuggestionStatus } from "@/lib/types";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// ─── Kit Queries ────────────────────────────────────────────────

export interface AdminKitFilters {
  search?: string;
  grade?: string;
  series?: string;
  category?: string;
  isActive?: string;
  page?: number;
  pageSize?: number;
}

export const getAdminKits = cache(
  async (filters: AdminKitFilters = {}): Promise<AdminGunplaKitUI[]> => {
    const { search, grade, series, category, isActive, page = 1, pageSize = 20 } = filters;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { seriesName: { contains: search, mode: "insensitive" } },
        { modelNumber: { contains: search, mode: "insensitive" } },
      ];
    }
    if (grade) where.grade = grade;
    if (series) where.seriesName = series;
    if (category && category !== "ALL") where.category = category;
    if (isActive === "true") where.isActive = true;
    if (isActive === "false") where.isActive = false;

    const kits = await db.gunplaKit.findMany({
      where,
      include: {
        series: { select: { name: true } },
        _count: { select: { userKits: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return kits.map((kit) => ({
      id: kit.id,
      name: kit.name,
      seriesName: kit.seriesName,
      grade: kit.grade,
      scale: kit.scale,
      releaseYear: kit.releaseYear,
      manufacturer: kit.manufacturer,
      imageUrl: kit.imageUrl ? toCdnUrl(kit.imageUrl) : kit.imageUrl,
      slug: kit.slug,
      description: kit.description,
      modelNumber: kit.modelNumber,
      japaneseTitle: kit.japaneseTitle,
      price: kit.price ? Number(kit.price) : null,
      imageFocalX: kit.imageFocalX,
      imageFocalY: kit.imageFocalY,
      timeline: kit.timeline,
      brand: kit.brand,
      category: kit.category as KitCategory,
      isActive: kit.isActive,
      seriesId: kit.seriesId,
      seriesTitle: kit.series?.name ?? null,
      totalOwners: kit._count.userKits,
      createdAt: formatDate(kit.createdAt),
      updatedAt: formatDate(kit.updatedAt),
    }));
  }
);

export const getAdminKitCount = cache(
  async (filters: AdminKitFilters = {}): Promise<number> => {
    const { search, grade, series, category, isActive } = filters;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { seriesName: { contains: search, mode: "insensitive" } },
        { modelNumber: { contains: search, mode: "insensitive" } },
      ];
    }
    if (grade) where.grade = grade;
    if (series) where.seriesName = series;
    if (category && category !== "ALL") where.category = category;
    if (isActive === "true") where.isActive = true;
    if (isActive === "false") where.isActive = false;

    return db.gunplaKit.count({ where });
  }
);

export const getAdminKitById = cache(
  async (id: string): Promise<AdminGunplaKitUI | null> => {
    const kit = await db.gunplaKit.findUnique({
      where: { id },
      include: {
        series: { select: { name: true } },
        _count: { select: { userKits: true } },
      },
    });

    if (!kit) return null;

    return {
      id: kit.id,
      name: kit.name,
      seriesName: kit.seriesName,
      grade: kit.grade,
      scale: kit.scale,
      releaseYear: kit.releaseYear,
      manufacturer: kit.manufacturer,
      imageUrl: kit.imageUrl ? toCdnUrl(kit.imageUrl) : kit.imageUrl,
      slug: kit.slug,
      description: kit.description,
      modelNumber: kit.modelNumber,
      japaneseTitle: kit.japaneseTitle,
      price: kit.price ? Number(kit.price) : null,
      imageFocalX: kit.imageFocalX,
      imageFocalY: kit.imageFocalY,
      timeline: kit.timeline,
      brand: kit.brand,
      category: kit.category as KitCategory,
      isActive: kit.isActive,
      seriesId: kit.seriesId,
      seriesTitle: kit.series?.name ?? null,
      totalOwners: kit._count.userKits,
      createdAt: formatDate(kit.createdAt),
      updatedAt: formatDate(kit.updatedAt),
    };
  }
);

// ─── Series Queries ─────────────────────────────────────────────

export const getAdminSeries = cache(
  async (filters: { search?: string; page?: number; pageSize?: number } = {}): Promise<GundamSeriesUI[]> => {
    const { search, page = 1, pageSize = 50 } = filters;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { japaneseTitle: { contains: search, mode: "insensitive" } },
      ];
    }

    const series = await db.gundamSeries.findMany({
      where,
      include: { _count: { select: { kits: true } } },
      orderBy: { sortOrder: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return series.map((s) => ({
      id: s.id,
      name: s.name,
      japaneseTitle: s.japaneseTitle,
      timeline: s.timeline,
      yearStart: s.yearStart,
      yearEnd: s.yearEnd,
      abbreviation: s.abbreviation,
      sortOrder: s.sortOrder,
      kitCount: s._count.kits,
    }));
  }
);

export const getAdminSeriesCount = cache(
  async (filters: { search?: string } = {}): Promise<number> => {
    const { search } = filters;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { japaneseTitle: { contains: search, mode: "insensitive" } },
      ];
    }
    return db.gundamSeries.count({ where });
  }
);

export const getAllSeriesForDropdown = cache(
  async (): Promise<{ id: string; name: string; timeline: string | null }[]> => {
    return db.gundamSeries.findMany({
      select: { id: true, name: true, timeline: true },
      orderBy: { sortOrder: "asc" },
    });
  }
);

// ─── Suggestion Queries ─────────────────────────────────────────

export const getAdminSuggestions = cache(
  async (filters: { status?: string; page?: number; pageSize?: number } = {}): Promise<KitSuggestionUI[]> => {
    const { status, page = 1, pageSize = 20 } = filters;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (status && status !== "ALL") where.status = status;

    const suggestions = await db.kitSuggestion.findMany({
      where,
      include: {
        user: { select: { username: true, displayName: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return suggestions.map((s) => ({
      id: s.id,
      userId: s.userId,
      username: s.user.displayName || s.user.username || "",
      userAvatar: s.user.avatar ? toCdnUrl(s.user.avatar) : s.user.avatar,
      kitName: s.kitName,
      seriesName: s.seriesName,
      grade: s.grade,
      scale: s.scale,
      manufacturer: s.manufacturer,
      notes: s.notes,
      status: s.status as SuggestionStatus,
      adminNotes: s.adminNotes,
      createdAt: formatDate(s.createdAt),
      updatedAt: formatDate(s.updatedAt),
    }));
  }
);

export const getAdminSuggestionCount = cache(
  async (filters: { status?: string } = {}): Promise<number> => {
    const { status } = filters;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    return db.kitSuggestion.count({ where });
  }
);

// ─── Stats ──────────────────────────────────────────────────────

export const getCollectorStats = cache(async () => {
  const [totalKits, activeKits, totalSeries, pendingSuggestions] = await Promise.all([
    db.gunplaKit.count(),
    db.gunplaKit.count({ where: { isActive: true } }),
    db.gundamSeries.count(),
    db.kitSuggestion.count({ where: { status: "PENDING" } }),
  ]);

  return { totalKits, activeKits, totalSeries, pendingSuggestions };
});
