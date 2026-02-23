import { getCategories } from "@/lib/data/categories";
import { getThreads, getThreadCount, type ThreadSort } from "@/lib/data/threads";
import { ForumFeed } from "./forum-feed";

type Props = { searchParams: Promise<{ page?: string; sort?: string }> };

export default async function ForumPage({ searchParams }: Props) {
  const { page: pageStr, sort: sortStr } = await searchParams;

  const page = Math.max(1, parseInt(pageStr || "1", 10) || 1);
  const sort = (["newest", "most-replies", "most-views"].includes(sortStr ?? "")
    ? sortStr
    : "newest") as ThreadSort;
  const limit = 20;

  const [categories, threads, totalCount] = await Promise.all([
    getCategories(),
    getThreads(page, limit, sort),
    getThreadCount(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <ForumFeed
      categories={categories}
      threads={threads}
      currentPage={page}
      totalPages={totalPages}
      sort={sort}
    />
  );
}
