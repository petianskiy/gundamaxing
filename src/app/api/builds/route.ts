import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Shared build include — same as in data/builds.ts
const buildInclude = {
  user: {
    select: {
      id: true,
      username: true,
      displayName: true,
      avatar: true,
      verificationTier: true,
    },
  },
  images: {
    orderBy: { order: "asc" as const },
    select: {
      id: true,
      url: true,
      alt: true,
      isPrimary: true,
      objectPosition: true,
      order: true,
    },
  },
  _count: {
    select: {
      likes: true,
      comments: true,
      bookmarks: true,
      forks: true,
    },
  },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "40"), 60);

  try {
    const builds = await db.build.findMany({
      where: { user: { isProfilePrivate: false } },
      include: buildInclude,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = builds.length > limit;
    const items = hasMore ? builds.slice(0, limit) : builds;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({ builds: items, nextCursor });
  } catch {
    return NextResponse.json({ error: "Failed to load builds" }, { status: 500 });
  }
}
