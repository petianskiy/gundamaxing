import { cache } from "react";
import { db } from "@/lib/db";
import { buildInclude, toUIBuild } from "@/lib/data/builds";
import type { Build } from "@/lib/types";

export const getBookmarkedBuilds = cache(
  async (userId: string): Promise<Build[]> => {
    const bookmarks = await db.bookmark.findMany({
      where: { userId },
      include: {
        build: {
          include: buildInclude,
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return bookmarks.map((b) => toUIBuild(b.build));
  }
);
