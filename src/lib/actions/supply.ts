"use server";

import { searchSupplies, getSupplyById } from "@/lib/data/supplies";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * Search the supply catalog. Public action (no auth required).
 */
export async function searchSupplyCatalog(query: string) {
  if (!query || query.trim().length < 2) return [];
  return searchSupplies(query.trim(), 8);
}

/**
 * Link a supply to a build. Requires build ownership.
 */
export async function linkSupplyToBuild(data: {
  buildId: string;
  supplyId: string;
  rawText?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "You must be signed in." };

    const build = await db.build.findUnique({
      where: { id: data.buildId },
      select: { userId: true },
    });
    if (!build) return { error: "Build not found." };
    if (build.userId !== session.user.id) return { error: "Not authorized." };

    // Verify supply exists
    const supply = await getSupplyById(data.supplyId);
    if (!supply) return { error: "Supply not found." };

    await db.buildSupply.upsert({
      where: {
        buildId_supplyId: {
          buildId: data.buildId,
          supplyId: data.supplyId,
        },
      },
      create: {
        buildId: data.buildId,
        supplyId: data.supplyId,
        rawText: data.rawText || null,
      },
      update: {
        rawText: data.rawText || null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("linkSupplyToBuild error:", error);
    return { error: "An unexpected error occurred." };
  }
}

/**
 * Unlink a supply from a build.
 */
export async function unlinkSupplyFromBuild(data: {
  buildId: string;
  supplyId: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "You must be signed in." };

    const build = await db.build.findUnique({
      where: { id: data.buildId },
      select: { userId: true },
    });
    if (!build) return { error: "Build not found." };
    if (build.userId !== session.user.id) return { error: "Not authorized." };

    await db.buildSupply.deleteMany({
      where: {
        buildId: data.buildId,
        supplyId: data.supplyId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("unlinkSupplyFromBuild error:", error);
    return { error: "An unexpected error occurred." };
  }
}
