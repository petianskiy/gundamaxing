"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import type { BuildStatus } from "@prisma/client";
import { showcaseLayoutSchema } from "@/lib/validations/showcase";
import { validateCleanContent } from "@/lib/security/profanity";
import { checkAndAwardAchievements } from "@/lib/achievements";
import { checkBanned } from "@/lib/security/ban-check";

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
  description: z.string().max(5000).optional(),
  intentStatement: z.string().max(1000).optional(),
  imageUrls: z.array(z.string().min(1)).min(1).max(25),
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

    const banError = await checkBanned(session.user.id);
    if (banError) return { error: banError };

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
    const supplyIdsRaw = formData.get("supplyIds") as string | null;
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
      description: (formData.get("description") as string) || undefined,
      intentStatement:
        (formData.get("intentStatement") as string) || undefined,
      imageUrls: imageUrlsRaw ? JSON.parse(imageUrlsRaw) : [],
      primaryIndex: primaryIndexRaw ? parseInt(primaryIndexRaw, 10) : 0,
    };

    const parsed = buildSchema.safeParse(raw);
    if (!parsed.success) {
      console.error("Build validation errors:", parsed.error.issues);
      const missing: string[] = [];
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "title") missing.push("Title");
        else if (field === "kitName") missing.push("Kit Name");
        else if (field === "grade") missing.push("Grade");
        else if (field === "imageUrls") missing.push("Photos");
      }
      if (missing.length > 0) {
        return { error: `Please fill in the required fields: ${missing.join(", ")}` };
      }
      return { error: "Invalid build data. Please check all required fields." };
    }

    const data = parsed.data;

    // Profanity check
    const titleCheck = validateCleanContent(data.title, "Title");
    if (titleCheck) return { error: titleCheck };
    const kitNameCheck = validateCleanContent(data.kitName, "Kit name");
    if (kitNameCheck) return { error: kitNameCheck };
    if (data.description) {
      const descCheck = validateCleanContent(data.description, "Description");
      if (descCheck) return { error: descCheck };
    }
    if (data.intentStatement) {
      const intentCheck = validateCleanContent(data.intentStatement, "Intent statement");
      if (intentCheck) return { error: intentCheck };
    }

    const primaryIdx = data.primaryIndex ?? 0;
    const objectPositionsRaw = formData.get("objectPositions") as string | null;
    const objectPositions: Record<number, string> = objectPositionsRaw ? JSON.parse(objectPositionsRaw) : {};
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
          description: data.description ?? null,
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
          ...(objectPositions[i] ? { objectPosition: objectPositions[i] } : {}),
        })),
      });

      // Link structured supplies if provided
      const supplyIds: string[] = supplyIdsRaw ? JSON.parse(supplyIdsRaw) : [];
      if (supplyIds.length > 0) {
        await tx.buildSupply.createMany({
          data: supplyIds.map((supplyId) => ({
            buildId: newBuild.id,
            supplyId,
          })),
          skipDuplicates: true,
        });
      }

      return newBuild;
    });

    revalidatePath("/builds");

    // Fire-and-forget achievement check
    checkAndAwardAchievements(user.id, "BUILDING").catch(() => {});

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

    const banError = await checkBanned(session.user.id);
    if (banError) return { error: banError };

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
    const supplyIdsRaw = formData.get("supplyIds") as string | null;
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
    const description = formData.get("description") as string;
    if (description !== null) updateData.description = description || null;
    const intentStatement = formData.get("intentStatement") as string;
    if (intentStatement !== null) updateData.intentStatement = intentStatement || null;

    // Profanity check
    if (title) {
      const titleCheck = validateCleanContent(title, "Title");
      if (titleCheck) return { error: titleCheck };
    }
    if (kitName) {
      const kitNameCheck = validateCleanContent(kitName, "Kit name");
      if (kitNameCheck) return { error: kitNameCheck };
    }
    if (description) {
      const descCheck = validateCleanContent(description, "Description");
      if (descCheck) return { error: descCheck };
    }
    if (intentStatement) {
      const intentCheck = validateCleanContent(intentStatement, "Intent statement");
      if (intentCheck) return { error: intentCheck };
    }

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

      // Update structured supplies if provided
      const supplyIds: string[] = supplyIdsRaw ? JSON.parse(supplyIdsRaw) : [];
      if (supplyIdsRaw) {
        await tx.buildSupply.deleteMany({ where: { buildId } });
        if (supplyIds.length > 0) {
          await tx.buildSupply.createMany({
            data: supplyIds.map((supplyId) => ({
              buildId,
              supplyId,
            })),
            skipDuplicates: true,
          });
        }
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

export async function updateBuildInfo(data: {
  buildId: string;
  title?: string;
  kitName?: string;
  grade?: string;
  scale?: string;
  status?: string;
  techniques?: string[];
  tools?: string[];
  description?: string;
  intentStatement?: string;
  paintSystem?: string;
  topcoat?: string;
  timeInvested?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "You must be signed in." };

    const banError = await checkBanned(session.user.id);
    if (banError) return { error: banError };

    const build = await db.build.findUnique({
      where: { id: data.buildId },
      select: { id: true, userId: true, slug: true, title: true, user: { select: { username: true } } },
    });
    if (!build) return { error: "Build not found." };
    if (build.userId !== session.user.id) return { error: "Not authorized." };

    // Profanity checks
    if (data.title) {
      const check = validateCleanContent(data.title, "Title");
      if (check) return { error: check };
    }
    if (data.kitName) {
      const check = validateCleanContent(data.kitName, "Kit name");
      if (check) return { error: check };
    }
    if (data.description) {
      const check = validateCleanContent(data.description, "Description");
      if (check) return { error: check };
    }
    if (data.intentStatement) {
      const check = validateCleanContent(data.intentStatement, "Intent statement");
      if (check) return { error: check };
    }

    // If title changed, regenerate slug
    let newSlug: string | undefined;
    if (data.title && data.title !== build.title) {
      const baseSlug = generateSlug(data.title);
      newSlug = await uniqueSlug(baseSlug);
    }

    await db.build.update({
      where: { id: data.buildId },
      data: {
        ...(data.title && { title: data.title }),
        ...(newSlug && { slug: newSlug }),
        ...(data.kitName && { kitName: data.kitName }),
        ...(data.grade && { grade: data.grade }),
        ...(data.scale && { scale: data.scale }),
        ...(data.status && { status: toDbStatus(data.status) }),
        ...(data.techniques && { techniques: data.techniques }),
        ...(data.tools !== undefined && { tools: data.tools }),
        description: data.description ?? null,
        intentStatement: data.intentStatement ?? null,
        paintSystem: data.paintSystem ?? null,
        topcoat: data.topcoat ?? null,
        timeInvested: data.timeInvested ?? null,
      },
    });

    revalidatePath(`/builds/${newSlug || build.slug}`);
    revalidatePath("/builds");
    if (build.user?.username) {
      revalidatePath(`/u/${build.user.username}`);
    }
    return { success: true, ...(newSlug && { newSlug }) };
  } catch (error) {
    console.error("updateBuildInfo error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function updateImagePosition(data: {
  buildId: string;
  imageId: string;
  objectPosition: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "You must be signed in." };

    const banError = await checkBanned(session.user.id);
    if (banError) return { error: banError };

    // Validate objectPosition format (e.g. "50% 30%")
    if (!/^\d{1,3}% \d{1,3}%$/.test(data.objectPosition)) {
      return { error: "Invalid position format." };
    }

    const build = await db.build.findUnique({
      where: { id: data.buildId },
      select: { id: true, userId: true, slug: true, user: { select: { username: true } } },
    });
    if (!build) return { error: "Build not found." };
    if (build.userId !== session.user.id) return { error: "Not authorized." };

    const image = await db.buildImage.findFirst({
      where: { id: data.imageId, buildId: data.buildId },
    });
    if (!image) return { error: "Image not found." };

    await db.buildImage.update({
      where: { id: data.imageId },
      data: { objectPosition: data.objectPosition },
    });

    revalidatePath(`/builds/${build.slug}`);
    revalidatePath("/builds");
    if (build.user?.username) {
      revalidatePath(`/u/${build.user.username}`);
    }
    return { success: true };
  } catch (error) {
    console.error("updateImagePosition error:", error);
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

    // Log any image references that don't belong to this build (non-blocking)
    const buildImageIds = new Set(build.images.map((img) => img.id));
    for (const element of parsed.data.elements) {
      if (element.type === "image" && !buildImageIds.has(element.imageId)) {
        console.warn(`[updateShowcaseLayout] Image element ${element.id} references unknown imageId ${element.imageId} — allowing save`);
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

    if (build._count.images >= 15) return { error: "Maximum 15 images per build." };

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

    const banError = await checkBanned(session.user.id);
    if (banError) return { error: banError };

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
      select: { id: true, userId: true, slug: true, user: { select: { username: true } } },
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

    revalidatePath(`/builds/${build.slug}`);
    revalidatePath("/builds");
    if (build.user?.username) {
      revalidatePath(`/u/${build.user.username}`);
    }
    return { success: true };
  } catch (error) {
    console.error("setPrimaryImage error:", error);
    return { error: "An unexpected error occurred." };
  }
}
