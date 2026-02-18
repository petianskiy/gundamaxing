"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createEraSchema, updateEraSchema } from "@/lib/validations/hangar";

export async function createEra(data: { name: string; description?: string; coverImage?: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const parsed = createEraSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const userId = session.user.id;

    // Calculate next order value
    const maxOrder = await db.buildEra.aggregate({
      where: { userId },
      _max: { order: true },
    });
    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    const era = await db.buildEra.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        coverImage: parsed.data.coverImage || null,
        order: nextOrder,
        userId,
      },
    });

    return { success: true, era };
  } catch (error) {
    console.error("createEra error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function updateEra(data: { id: string; name?: string; description?: string; coverImage?: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const parsed = updateEraSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const userId = session.user.id;

    // Verify ownership
    const era = await db.buildEra.findUnique({
      where: { id: parsed.data.id },
    });

    if (!era || era.userId !== userId) {
      return { error: "Era not found or you do not own it." };
    }

    const updatedEra = await db.buildEra.update({
      where: { id: parsed.data.id },
      data: {
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.description !== undefined && { description: parsed.data.description || null }),
        ...(parsed.data.coverImage !== undefined && { coverImage: parsed.data.coverImage || null }),
      },
    });

    return { success: true, era: updatedEra };
  } catch (error) {
    console.error("updateEra error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function deleteEra(eraId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const userId = session.user.id;

    // Verify ownership
    const era = await db.buildEra.findUnique({
      where: { id: eraId },
    });

    if (!era || era.userId !== userId) {
      return { error: "Era not found or you do not own it." };
    }

    await db.buildEra.delete({
      where: { id: eraId },
    });

    return { success: true };
  } catch (error) {
    console.error("deleteEra error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function reorderEras(eraIds: string[]) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const userId = session.user.id;

    // Verify all eras belong to the user
    const eras = await db.buildEra.findMany({
      where: { id: { in: eraIds }, userId },
      select: { id: true },
    });

    if (eras.length !== eraIds.length) {
      return { error: "One or more eras not found or you do not own them." };
    }

    // Update order for each era
    await db.$transaction(
      eraIds.map((id, index) =>
        db.buildEra.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    return { success: true };
  } catch (error) {
    console.error("reorderEras error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function assignBuildToEra(buildId: string, eraId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const userId = session.user.id;

    // Verify ownership of both build and era
    const [build, era] = await Promise.all([
      db.build.findUnique({ where: { id: buildId }, select: { id: true, userId: true } }),
      db.buildEra.findUnique({ where: { id: eraId }, select: { id: true, userId: true } }),
    ]);

    if (!build || build.userId !== userId) {
      return { error: "Build not found or you do not own it." };
    }

    if (!era || era.userId !== userId) {
      return { error: "Era not found or you do not own it." };
    }

    // Calculate next order in this era
    const maxOrder = await db.buildEraAssignment.aggregate({
      where: { eraId },
      _max: { order: true },
    });
    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    await db.buildEraAssignment.create({
      data: {
        buildId,
        eraId,
        order: nextOrder,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("assignBuildToEra error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function removeBuildFromEra(buildId: string, eraId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const userId = session.user.id;

    // Verify ownership of both build and era
    const [build, era] = await Promise.all([
      db.build.findUnique({ where: { id: buildId }, select: { id: true, userId: true } }),
      db.buildEra.findUnique({ where: { id: eraId }, select: { id: true, userId: true } }),
    ]);

    if (!build || build.userId !== userId) {
      return { error: "Build not found or you do not own it." };
    }

    if (!era || era.userId !== userId) {
      return { error: "Era not found or you do not own it." };
    }

    await db.buildEraAssignment.delete({
      where: {
        buildId_eraId: { buildId, eraId },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("removeBuildFromEra error:", error);
    return { error: "An unexpected error occurred." };
  }
}
