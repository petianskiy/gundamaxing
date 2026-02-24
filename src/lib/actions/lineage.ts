"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createLineageSchema, updateLineageSchema, saveNodesSchema } from "@/lib/validations/lineage";
import { checkAndAwardAchievements } from "@/lib/achievements";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base || "lineage";
  let existing = await db.lineage.findUnique({ where: { slug }, select: { id: true } });
  if (!existing) return slug;
  let suffix = 2;
  while (existing) {
    slug = `${base}-${suffix}`;
    existing = await db.lineage.findUnique({ where: { slug }, select: { id: true } });
    suffix++;
  }
  return slug;
}

export async function createLineage(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const raw = {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    isPublic: formData.get("isPublic") === "true",
  };

  const parsed = createLineageSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const slug = await uniqueSlug(generateSlug(parsed.data.title));

  const lineage = await db.lineage.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      slug,
      userId: session.user.id,
      isPublic: parsed.data.isPublic,
    },
  });

  revalidatePath("/lineages");
  revalidatePath("/lineages/mine");

  // Fire-and-forget achievement check
  checkAndAwardAchievements(session.user.id, "LINEAGE").catch(() => {});

  return { success: true, slug: lineage.slug, id: lineage.id };
}

export async function updateLineage(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const raw = {
    id: formData.get("id") as string,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    isPublic: formData.get("isPublic") === "true",
  };

  const parsed = updateLineageSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const lineage = await db.lineage.findUnique({ where: { id: parsed.data.id }, select: { userId: true } });
  if (!lineage || lineage.userId !== session.user.id) return { error: "Not authorized" };

  await db.lineage.update({
    where: { id: parsed.data.id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      isPublic: parsed.data.isPublic,
    },
  });

  revalidatePath("/lineages");
  revalidatePath("/lineages/mine");
  return { success: true };
}

export async function deleteLineage(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const id = formData.get("id") as string;
  if (!id) return { error: "Missing lineage ID" };

  const lineage = await db.lineage.findUnique({ where: { id }, select: { userId: true } });
  if (!lineage || lineage.userId !== session.user.id) return { error: "Not authorized" };

  await db.lineage.delete({ where: { id } });

  revalidatePath("/lineages");
  revalidatePath("/lineages/mine");
  return { success: true };
}

export async function saveLineageNodes(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const raw = {
    lineageId: formData.get("lineageId") as string,
    nodes: JSON.parse(formData.get("nodes") as string || "[]"),
  };

  const parsed = saveNodesSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const lineage = await db.lineage.findUnique({ where: { id: parsed.data.lineageId }, select: { userId: true, slug: true } });
  if (!lineage || lineage.userId !== session.user.id) return { error: "Not authorized" };

  // Verify all builds belong to the user
  const buildIds = parsed.data.nodes.map((n) => n.buildId);
  const builds = await db.build.findMany({
    where: { id: { in: buildIds }, userId: session.user.id },
    select: { id: true },
  });
  if (builds.length !== buildIds.length) return { error: "Some builds were not found or don't belong to you" };

  // Transaction: delete existing nodes, create new ones
  await db.$transaction([
    db.lineageNode.deleteMany({ where: { lineageId: parsed.data.lineageId } }),
    ...parsed.data.nodes.map((node, i) =>
      db.lineageNode.create({
        data: {
          lineageId: parsed.data.lineageId,
          buildId: node.buildId,
          parentId: node.parentId,
          annotation: node.annotation,
          order: node.order ?? i,
        },
      })
    ),
  ]);

  revalidatePath(`/lineages/${lineage.slug}`);
  revalidatePath("/lineages");
  return { success: true };
}

export async function toggleLineagePublic(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const id = formData.get("id") as string;
  if (!id) return { error: "Missing lineage ID" };

  const lineage = await db.lineage.findUnique({ where: { id }, select: { userId: true, isPublic: true } });
  if (!lineage || lineage.userId !== session.user.id) return { error: "Not authorized" };

  await db.lineage.update({ where: { id }, data: { isPublic: !lineage.isPublic } });

  revalidatePath("/lineages");
  revalidatePath("/lineages/mine");
  return { success: true, isPublic: !lineage.isPublic };
}
