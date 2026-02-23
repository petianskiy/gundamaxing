import { searchThreads, searchThreadCount } from "@/lib/data/threads";
import { SearchView } from "./search-view";

type Props = { searchParams: Promise<{ q?: string; page?: string }> };

export default async function ForumSearchPage({ searchParams }: Props) {
  const { q: query, page: pageStr } = await searchParams;

  if (!query?.trim()) {
    return <SearchView query="" threads={[]} currentPage={1} totalPages={1} />;
  }

  const page = Math.max(1, parseInt(pageStr || "1", 10) || 1);
  const limit = 20;

  const [threads, totalCount] = await Promise.all([
    searchThreads(query, page, limit),
    searchThreadCount(query),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <SearchView
      query={query}
      threads={threads}
      currentPage={page}
      totalPages={totalPages}
    />
  );
}
