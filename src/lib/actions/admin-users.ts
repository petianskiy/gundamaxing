"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { calculateLevel } from "@/lib/achievements";

const LEVEL_XP_MAP: Record<number, number> = {
  1: 0,
  2: 100,
  3: 300,
  4: 700,
  5: 1500,
};

export async function adminSetUserLevel(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const admin = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (admin?.role !== "ADMIN") return;

  const userId = formData.get("userId") as string;
  const level = parseInt(formData.get("level") as string, 10);
  if (!userId || isNaN(level) || level < 1 || level > 5) return;

  const xp = LEVEL_XP_MAP[level] ?? 0;

  await db.user.update({
    where: { id: userId },
    data: { level, xp },
  });

  revalidatePath(`/admin/users/${userId}`);
}

export async function adminSetUserXp(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const admin = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (admin?.role !== "ADMIN") return;

  const userId = formData.get("userId") as string;
  const xp = parseInt(formData.get("xp") as string, 10);
  if (!userId || isNaN(xp) || xp < 0) return;

  const newLevel = calculateLevel(xp);

  await db.user.update({
    where: { id: userId },
    data: { xp, level: newLevel },
  });

  revalidatePath(`/admin/users/${userId}`);
}
