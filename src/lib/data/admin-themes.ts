import { cache } from "react";
import { db } from "@/lib/db";

export interface HangarThemeConfigUI {
  id: string;
  name: string;
  slug: string;
  badgeColor: string;
  unlockLevel: number;
  backgroundType: string;
  backgroundImages: string[] | null;
  backgroundVideoUrl: string | null;
  backgroundPosterUrl: string | null;
  carouselInterval: number;
  dimness: number;
  effects: { type: string; color: string; size: number; speed: number; density: number }[] | null;
  gridConfig: { topOffset: number; leftOffset: number; width: number; columns: number } | null;
  isPublished: boolean;
  sortOrder: number;
}

export const getAdminThemes = cache(async (): Promise<HangarThemeConfigUI[]> => {
  const themes = await db.hangarThemeConfig.findMany({ orderBy: { sortOrder: "asc" } });
  return themes.map((t) => ({
    ...t,
    backgroundImages: t.backgroundImages as string[] | null,
    effects: t.effects as HangarThemeConfigUI["effects"],
    gridConfig: t.gridConfig as HangarThemeConfigUI["gridConfig"],
  }));
});

export const getPublishedThemes = cache(async (): Promise<HangarThemeConfigUI[]> => {
  const themes = await db.hangarThemeConfig.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
  });
  return themes.map((t) => ({
    ...t,
    backgroundImages: t.backgroundImages as string[] | null,
    effects: t.effects as HangarThemeConfigUI["effects"],
    gridConfig: t.gridConfig as HangarThemeConfigUI["gridConfig"],
  }));
});

export const getThemeBySlug = cache(async (slug: string): Promise<HangarThemeConfigUI | null> => {
  const t = await db.hangarThemeConfig.findUnique({ where: { slug } });
  if (!t) return null;
  return {
    ...t,
    backgroundImages: t.backgroundImages as string[] | null,
    effects: t.effects as HangarThemeConfigUI["effects"],
    gridConfig: t.gridConfig as HangarThemeConfigUI["gridConfig"],
  };
});
