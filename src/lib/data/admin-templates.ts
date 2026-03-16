import { cache } from "react";
import { db } from "@/lib/db";

export interface CustomTemplateUI {
  id: string;
  name: string;
  category: string;
  imageCount: number;
  slots: { x: number; y: number; w: number; h: number; type: "image" | "text" | "meta" }[];
  isActive: boolean;
  sortOrder: number;
}

export const getAdminTemplates = cache(async (): Promise<CustomTemplateUI[]> => {
  const templates = await db.customTemplate.findMany({
    orderBy: { sortOrder: "asc" },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return templates.map((t: any) => ({
    ...t,
    slots: t.slots as CustomTemplateUI["slots"],
  }));
});

export const getActiveCustomTemplates = cache(async (): Promise<CustomTemplateUI[]> => {
  const templates = await db.customTemplate.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return templates.map((t: any) => ({
    ...t,
    slots: t.slots as CustomTemplateUI["slots"],
  }));
});
