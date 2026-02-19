"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import type { BuildStatus } from "@prisma/client";
import { showcaseLayoutSchema } from "@/lib/validations/showcase";

const buildSchema = z.object({
  title: z.string().min(1).max(200),
  kitName: z.string().min(1).max(200),
  grade: z.string().min(1),
  timeline: z.string().optional(),
  scale: z.string().optional(),
  status: z.string().optional(),
  techniques: z.array(z.string()).optional(),
  paintSystem: z.string().optional(),
  topcoat: z.string().optional(),
  timeInvested: z.string().optional(),
  tools: z.array(z.string()).optional(),
  intentStatement: z.string().max(1000).optional(),
  imageUrls: z.array(z.string().url()).min(1).max(25),
  primaryIndex: z.number().int().min(0).optional(),
});

// Generate a URL-safe slug from a title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

// Ensure slug uniqueness by appending -2, -3, etc.
async function uniqueSlug(base: string): Promise<string> {
  let slug = base || "build";
  let existing = await db.build.findUnique({ where: { slug }, select: { id: true } });
  if (!existing) return slug;

  let suffix = 2;
  while (existing) {
    slug = `${base}-${suffix}`;
    existing = await db.build.findUnique({ where: { slug }, select: { id: true } });
    suffix++;
  }
  return slug;
}

// Map UI status strings to Prisma BuildStatus enum values
function toDbStatus(uiStatus: string | undefined): BuildStatus {
  const map: Record<string, BuildStatus> = {
    WIP: "WIP",
    Completed: "COMPLETED",
    COMPLETED: "COMPLETED",
    Abandoned: "ABANDONED",
    ABANDONED: "ABANDONED",
  };
  return map[uiStatus ?? "WIP"] ?? "WIP";
}

export async function createBuild(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in to create a build." };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, emailVerified: true },
    });

    if (!user) {
      return { error: "User not found." };
    }

    if (!user.emailVerified) {
      return { error: "You must verify your email before creating builds." };
    }

    // Parse form data
    const techniquesRaw = formData.get("techniques") as string | null;
    const toolsRaw = formData.get("tools") as string | null;
    const imageUrlsRaw = formData.get("imageUrls") as string | null;
    const primaryIndexRaw = formData.get("primaryIndex") as string | null;

    const raw = {
      title: formData.get("title") as string,
      kitName: formData.get("kitName") as string,
      grade: formData.get("grade") as string,
      timeline: (formData.get("timeline") as string) || undefined,
      scale: (formData.get("scale") as string) || undefined,
      status: (formData.get("status") as string) || undefined,
      techniques: techniquesRaw ? JSON.parse(techniquesRaw) : undefined,
      paintSystem: (formData.get("paintSystem") as string) || undefined,
      topcoat: (formData.get("topcoat") as string) || undefined,
      timeInvested: (formData.get("timeInvested") as string) || undefined,
      tools: toolsRaw ? JSON.parse(toolsRaw) : undefined,
      intentStatement:
        (formData.get("intentStatement") as string) || undefined,
      imageUrls: imageUrlsRaw ? JSON.parse(imageUrlsRaw) : [],
      primaryIndex: primaryIndexRaw ? parseInt(primaryIndexRaw, 10) : 0,
    };

    const parsed = buildSchema.safeParse(raw);
    if (!parsed.success) {
      console.error("Build validation errors:", parsed.error.issues);
      return { error: "Invalid build data. Please check all required fields." };
    }

    const data = parsed.data;
    const primaryIdx = data.primaryIndex ?? 0;
    const slug = await uniqueSlug(generateSlug(data.title));

    // Check if this is the user's first build (for editor guide overlay)
    const existingBuildCount = await db.build.count({ where: { userId: user.id } });

    const build = await db.$transaction(async (tx) => {
      const newBuild = await tx.build.create({
        data: {
          slug,
          title: data.title,
          kitName: data.kitName,
          grade: data.grade,
          timeline: data.timeline ?? "",
          scale: data.scale ?? "",
          status: toDbStatus(data.status),
          techniques: data.techniques ?? [],
          paintSystem: data.paintSystem ?? null,
          topcoat: data.topcoat ?? null,
          timeInvested: data.timeInvested ?? null,
          tools: data.tools ?? [],
          intentStatement: data.intentStatement ?? null,
          userId: user.id,
        },
      });

      await tx.buildImage.createMany({
        data: data.imageUrls.map((url, i) => ({
          url,
          alt: data.title,
          isPrimary: i === primaryIdx,
          order: i,
          buildId: newBuild.id,
        })),
      });

      return newBuild;
    });

    revalidatePath("/builds");

    return { success: true, buildId: build.id, slug: build.slug, isFirstBuild: existingBuildCount === 0 };
  } catch (error) {
    console.error("createBuild error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function updateBuild(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const buildId = formData.get("buildId") as string;
    if (!buildId) {
      return { error: "Build ID is required." };
    }

    const build = await db.build.findUnique({
      where: { id: buildId },
      select: { id: true, userId: true },
    });

    if (!build) {
      return { error: "Build not found." };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    });

    if (!user) {
      return { error: "User not found." };
    }

    const isOwner = build.userId === user.id;
    const isAdmin = user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return { error: "You do not have permission to edit this build." };
    }

    // Parse form data
    const techniquesRaw = formData.get("techniques") as string | null;
    const toolsRaw = formData.get("tools") as string | null;
    const imageUrlsRaw = formData.get("imageUrls") as string | null;
    const primaryIndexRaw = formData.get("primaryIndex") as string | null;

    const updateData: Record<string, unknown> = {};

    const title = formData.get("title") as string;
    if (title) updateData.title = title;
    const kitName = formData.get("kitName") as string;
    if (kitName) updateData.kitName = kitName;
    const grade = formData.get("grade") as string;
    if (grade) updateData.grade = grade;
    const timeline = formData.get("timeline") as string;
    if (timeline) updateData.timeline = timeline;
    const scale = formData.get("scale") as string;
    if (scale) updateData.scale = scale;
    const status = formData.get("status") as string;
    if (status) updateData.status = toDbStatus(status);
    if (techniquesRaw) updateData.techniques = JSON.parse(techniquesRaw);
    const paintSystem = formData.get("paintSystem") as string;
    if (paintSystem !== null) updateData.paintSystem = paintSystem || null;
    const topcoat = formData.get("topcoat") as string;
    if (topcoat !== null) updateData.topcoat = topcoat || null;
    const timeInvested = formData.get("timeInvested") as string;
    if (timeInvested !== null) updateData.timeInvested = timeInvested || null;
    if (toolsRaw) updateData.tools = JSON.parse(toolsRaw);
    const intentStatement = formData.get("intentStatement") as string;
    if (intentStatement !== null) updateData.intentStatement = intentStatement || null;

    const imageUrls: string[] | null = imageUrlsRaw ? JSON.parse(imageUrlsRaw) : null;
    const primaryIdx = primaryIndexRaw ? parseInt(primaryIndexRaw, 10) : 0;

    await db.$transaction(async (tx) => {
      if (Object.keys(updateData).length > 0) {
        await tx.build.update({
          where: { id: buildId },
          data: updateData,
        });
      }

      if (imageUrls && imageUrls.length > 0) {
        await tx.buildImage.deleteMany({ where: { buildId } });
        await tx.buildImage.createMany({
          data: imageUrls.map((url, i) => ({
            url,
            alt: (title || build.userId) as string,
            isPrimary: i === primaryIdx,
            order: i,
            buildId,
          })),
        });
      }
    });

    revalidatePath(`/builds/${buildId}`);
    revalidatePath("/builds");

    return { success: true, buildId };
  } catch (error) {
    console.error("updateBuild error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function deleteBuild(buildId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in." };
    }

    const build = await db.build.findUnique({
      where: { id: buildId },
      select: { id: true, userId: true },
    });

    if (!build) {
      return { error: "Build not found." };
    }

    // Check if user is the owner or an admin
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    });

    if (!user) {
      return { error: "User not found." };
    }

    const isOwner = build.userId === user.id;
    const isAdmin = user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return { error: "You do not have permission to delete this build." };
    }

    // Delete build - cascades to images, comments, likes, etc.
    await db.build.delete({
      where: { id: buildId },
    });

    revalidatePath("/builds");
    revalidatePath(`/builds/${buildId}`);

    return { success: true };
  } catch (error) {
    console.error("deleteBuild error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function updateShowcaseLayout(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "You must be signed in." };

    const buildId = formData.get("buildId") as string;
    const layoutRaw = formData.get("showcaseLayout") as string;
    if (!buildId || !layoutRaw) return { error: "Missing required fields." };

    const build = await db.build.findUnique({
      where: { id: buildId },
      select: { id: true, userId: true, images: { select: { id: true } } },
    });
    if (!build) return { error: "Build not found." };

    if (build.userId !== session.user.id) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
      if (user?.role !== "ADMIN") return { error: "Not authorized." };
    }

    let layout;
    try {
      layout = JSON.parse(layoutRaw);
    } catch {
      return { error: "Invalid layout data." };
    }

    const parsed = showcaseLayoutSchema.safeParse(layout);
    if (!parsed.success) {
      console.error("Showcase layout validation failed:", parsed.error.issues);
      return { error: "Invalid layout structure." };
    }

    // Validate all imageIds belong to this build
    const buildImageIds = new Set(build.images.map((img) => img.id));
    for (const element of parsed.data.elements) {
      if (element.type === "image" && !buildImageIds.has(element.imageId)) {
        return { error: "Invalid image reference in layout." };
      }
    }

    await db.build.update({
      where: { id: buildId },
      data: { showcaseLayout: parsed.data as unknown as Prisma.InputJsonValue },
    });

    revalidatePath(`/builds/${buildId}`);
    return { success: true };
  } catch (error) {
    console.error("updateShowcaseLayout error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function clearShowcaseLayout(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "You must be signed in." };

    const buildId = formData.get("buildId") as string;
    if (!buildId) return { error: "Build ID is required." };

    const build = await db.build.findUnique({
      where: { id: buildId },
      select: { id: true, userId: true },
    });
    if (!build || build.userId !== session.user.id) {
      return { error: "Not authorized." };
    }

    await db.build.update({
      where: { id: buildId },
      data: { showcaseLayout: Prisma.JsonNull },
    });

    revalidatePath(`/builds/${buildId}`);
    return { success: true };
  } catch (error) {
    console.error("clearShowcaseLayout error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function addBuildImage(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "You must be signed in." };

    const buildId = formData.get("buildId") as string;
    const url = formData.get("url") as string;
    if (!buildId || !url) return { error: "Missing required fields." };

    const build = await db.build.findUnique({
      where: { id: buildId },
      select: { id: true, userId: true, _count: { select: { images: true } } },
    });
    if (!build) return { error: "Build not found." };

    if (build.userId !== session.user.id) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
      if (user?.role !== "ADMIN") return { error: "Not authorized." };
    }

    if (build._count.images >= 25) return { error: "Maximum 25 images per build." };

    const image = await db.buildImage.create({
      data: {
        buildId,
        url,
        alt: "Build image",
        isPrimary: false,
        order: build._count.images,
      },
    });

    revalidatePath(`/builds/${buildId}`);
    return { success: true, image: { id: image.id, url: image.url } };
  } catch (error) {
    console.error("addBuildImage error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function deleteBuildImage(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "You must be signed in." };

    const imageId = formData.get("imageId") as string;
    const buildId = formData.get("buildId") as string;
    if (!imageId || !buildId) return { error: "Missing required fields." };

    const build = await db.build.findUnique({
      where: { id: buildId },
      select: { id: true, userId: true, _count: { select: { images: true } } },
    });
    if (!build) return { error: "Build not found." };

    if (build.userId !== session.user.id) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
      if (user?.role !== "ADMIN") return { error: "Not authorized." };
    }

    if (build._count.images <= 1) return { error: "Cannot delete the last image." };

    await db.buildImage.delete({ where: { id: imageId } });

    revalidatePath(`/builds/${buildId}`);
    return { success: true };
  } catch (error) {
    console.error("deleteBuildImage error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function forkBuild(buildId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be signed in to fork a build." };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, emailVerified: true },
    });

    if (!user) {
      return { error: "User not found." };
    }

    if (!user.emailVerified) {
      return { error: "You must verify your email before forking builds." };
    }

    const sourceBuild = await db.build.findUnique({
      where: { id: buildId },
      include: {
        images: { orderBy: { order: "asc" } },
      },
    });

    if (!sourceBuild) {
      return { error: "Build not found." };
    }

    const forkSlug = await uniqueSlug(generateSlug(`Fork of ${sourceBuild.title}`));

    const newBuild = await db.$transaction(async (tx) => {
      const forked = await tx.build.create({
        data: {
          slug: forkSlug,
          title: `Fork of ${sourceBuild.title}`,
          kitName: sourceBuild.kitName,
          grade: sourceBuild.grade,
          timeline: sourceBuild.timeline,
          scale: sourceBuild.scale,
          status: "WIP",
          techniques: sourceBuild.techniques,
          paintSystem: sourceBuild.paintSystem,
          topcoat: sourceBuild.topcoat,
          timeInvested: null,
          tools: sourceBuild.tools,
          intentStatement: sourceBuild.intentStatement,
          baseKit: sourceBuild.baseKit,
          forkOfId: buildId,
          userId: user.id,
        },
      });

      // Copy images
      if (sourceBuild.images.length > 0) {
        await tx.buildImage.createMany({
          data: sourceBuild.images.map((img, i) => ({
            url: img.url,
            alt: img.alt,
            isPrimary: img.isPrimary,
            order: i,
            buildId: forked.id,
          })),
        });
      }

      // Increment source build's fork count
      await tx.build.update({
        where: { id: buildId },
        data: { forkCount: { increment: 1 } },
      });

      return forked;
    });

    revalidatePath(`/builds/${buildId}`);
    revalidatePath("/builds");

    return { success: true, buildId: newBuild.id, slug: newBuild.slug };
  } catch (error) {
    console.error("forkBuild error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function setPrimaryImage(buildId: string, imageId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "You must be signed in." };

    const build = await db.build.findUnique({
      where: { id: buildId },
      select: { id: true, userId: true },
    });

    if (!build || build.userId !== session.user.id) {
      return { error: "Not authorized." };
    }

    await db.$transaction(async (tx) => {
      await tx.buildImage.updateMany({
        where: { buildId },
        data: { isPrimary: false },
      });
      await tx.buildImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      });
    });

    revalidatePath(`/builds/${buildId}`);
    return { success: true };
  } catch (error) {
    console.error("setPrimaryImage error:", error);
    return { error: "An unexpected error occurred." };
  }
}
