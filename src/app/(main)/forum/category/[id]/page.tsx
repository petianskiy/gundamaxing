import { notFound } from "next/navigation";
import { getCategoryById } from "@/lib/data/categories";
import { getThreadsByCategory, getThreadCountByCategory, type ThreadSort } from "@/lib/data/threads";
import { CategoryView } from "./category-view";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
};

export default async function CategoryPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { page: pageStr, sort: sortStr } = await searchParams;

  const category = await getCategoryById(id);
  if (!category) notFound();

  const page = Math.max(1, parseInt(pageStr || "1", 10) || 1);
  const sort = (["newest", "most-replies", "most-views"].includes(sortStr ?? "")
    ? sortStr
    : "newest") as ThreadSort;
  const limit = 20;

  const [threads, totalCount] = await Promise.all([
    getThreadsByCategory(id, page, limit, sort),
    getThreadCountByCategory(id),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <CategoryView
      category={category}
      threads={threads}
      currentPage={page}
      totalPages={totalPages}
      sort={sort}
    />
  );
}
