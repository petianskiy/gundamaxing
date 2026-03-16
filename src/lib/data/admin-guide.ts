import { cache } from "react";
import { db } from "@/lib/db";

export interface GuideStepUI {
  id: string;
  selector: string;
  title: string;
  description: string;
  tip: string | null;
  sortOrder: number;
  isActive: boolean;
}

export const getGuideSteps = cache(async (): Promise<GuideStepUI[]> => {
  const steps = await db.editorGuideStep.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return steps;
});

export const getActiveGuideSteps = cache(async (): Promise<GuideStepUI[]> => {
  const steps = await db.editorGuideStep.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return steps;
});
