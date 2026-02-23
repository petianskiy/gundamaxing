import { cache } from "react";
import { db } from "@/lib/db";
import type { LineageSummary, LineageDetail, LineageNodeUI, Build, BuildImage } from "@/lib/types";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// Build a nested tree from flat nodes
function buildTree(flatNodes: Array<{
  id: string;
  buildId: string;
  parentId: string | null;
  annotation: string | null;
  order: number;
  build: {
    id: string;
    slug: string;
    title: string;
    kitName: string;
    grade: string;
    scale: string;
    status: string;
    images: Array<{ id: string; url: string; alt: string; isPrimary: boolean; objectPosition: string | null; order: number }>;
  };
}>): LineageNodeUI[] {
  const nodeMap = new Map<string, LineageNodeUI>();
  const roots: LineageNodeUI[] = [];

  // Create all nodes first — key by buildId since parentId references a buildId
  for (const node of flatNodes) {
    nodeMap.set(node.buildId, {
      id: node.id,
      buildId: node.buildId,
      build: {
        id: node.build.id,
        slug: node.build.slug,
        title: node.build.title,
        kitName: node.build.kitName,
        grade: node.build.grade as Build["grade"],
        scale: node.build.scale as Build["scale"],
        images: node.build.images.map((img): BuildImage => ({
          id: img.id,
          url: img.url,
          alt: img.alt,
          isPrimary: img.isPrimary,
          objectPosition: img.objectPosition ?? undefined,
          order: img.order,
        })),
        status: node.build.status === "COMPLETED" ? "Completed" : node.build.status === "ABANDONED" ? "Abandoned" : "WIP",
      },
      parentId: node.parentId,
      annotation: node.annotation,
      order: node.order,
      children: [],
    });
  }

  // Build parent-child relationships (parentId stores a buildId)
  for (const node of flatNodes) {
    const uiNode = nodeMap.get(node.buildId)!;
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)!.children.push(uiNode);
    } else {
      roots.push(uiNode);
    }
  }

  // Sort children by order
  for (const node of nodeMap.values()) {
    node.children.sort((a, b) => a.order - b.order);
  }
  roots.sort((a, b) => a.order - b.order);

  return roots;
}

const lineageInclude = {
  user: { select: { id: true, username: true, displayName: true, avatar: true } },
  nodes: {
    include: {
      build: {
        include: {
          images: { orderBy: { order: "asc" as const }, take: 3 },
        },
      },
    },
    orderBy: { order: "asc" as const },
  },
} as const;

function toLineageSummary(l: any): LineageSummary {
  return {
    id: l.id,
    slug: l.slug,
    title: l.title,
    description: l.description,
    coverImage: l.coverImage,
    userId: l.userId,
    username: l.user?.displayName || l.user?.username || "",
    userHandle: l.user?.username || "",
    userAvatar: l.user?.avatar ?? "",
    isPublic: l.isPublic,
    nodeCount: l.nodes?.length ?? 0,
    previewBuilds: (l.nodes ?? []).slice(0, 3).map((n: any) => ({
      id: n.build.id,
      title: n.build.title,
      images: n.build.images.map((img: any) => ({
        id: img.id,
        url: img.url,
        alt: img.alt,
        isPrimary: img.isPrimary,
        objectPosition: img.objectPosition ?? undefined,
        order: img.order,
      })),
    })),
    createdAt: formatDate(l.createdAt),
    updatedAt: formatDate(l.updatedAt),
  };
}

export const getPublicLineages = cache(async (page = 1, limit = 12): Promise<{ lineages: LineageSummary[]; total: number }> => {
  const [lineages, total] = await Promise.all([
    db.lineage.findMany({
      where: { isPublic: true },
      include: lineageInclude,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.lineage.count({ where: { isPublic: true } }),
  ]);
  return { lineages: lineages.map(toLineageSummary), total };
});

export const getLineageBySlug = cache(async (slug: string): Promise<LineageDetail | null> => {
  const lineage = await db.lineage.findUnique({
    where: { slug },
    include: lineageInclude,
  });
  if (!lineage) return null;

  return {
    id: lineage.id,
    slug: lineage.slug,
    title: lineage.title,
    description: lineage.description,
    coverImage: lineage.coverImage,
    userId: lineage.userId,
    username: lineage.user?.displayName || lineage.user?.username || "",
    userHandle: lineage.user?.username || "",
    userAvatar: lineage.user?.avatar ?? "",
    isPublic: lineage.isPublic,
    nodes: buildTree(lineage.nodes as any),
    createdAt: formatDate(lineage.createdAt),
    updatedAt: formatDate(lineage.updatedAt),
  };
});

export const getLineagesByUserId = cache(async (userId: string): Promise<LineageSummary[]> => {
  const lineages = await db.lineage.findMany({
    where: { userId },
    include: lineageInclude,
    orderBy: { updatedAt: "desc" },
  });
  return lineages.map(toLineageSummary);
});

export const getUserBuildsForLineage = cache(async (userId: string): Promise<Pick<Build, "id" | "slug" | "title" | "kitName" | "grade" | "scale" | "images" | "status">[]> => {
  const builds = await db.build.findMany({
    where: { userId },
    select: {
      id: true,
      slug: true,
      title: true,
      kitName: true,
      grade: true,
      scale: true,
      status: true,
      images: { orderBy: { order: "asc" as const }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });
  return builds.map((b) => ({
    id: b.id,
    slug: b.slug,
    title: b.title,
    kitName: b.kitName,
    grade: b.grade as Build["grade"],
    scale: b.scale as Build["scale"],
    status: b.status === "COMPLETED" ? "Completed" as const : b.status === "ABANDONED" ? "Abandoned" as const : "WIP" as const,
    images: b.images.map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.alt,
      isPrimary: img.isPrimary,
      objectPosition: img.objectPosition ?? undefined,
      order: img.order,
    })),
  }));
});
