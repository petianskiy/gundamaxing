import { getCategories } from "@/lib/data/categories";
import { getThreads, getThreadCount, type ThreadSort } from "@/lib/data/threads";
import {
  getActivePilots,
  getTopContributors,
  getRecentActivity,
  getActiveMission,
} from "@/lib/data/forum-sidebar";
import { ForumFeed } from "./forum-feed";

export const metadata = {
  title: "Forum | Gundamaxing",
  description: "Discuss Gunpla building techniques, share tips, and connect with fellow builders.",
};

type Props = { searchParams: Promise<{ page?: string; sort?: string }> };

export default async function ForumPage({ searchParams }: Props) {
  const { page: pageStr, sort: sortStr } = await searchParams;

  const page = Math.max(1, parseInt(pageStr || "1", 10) || 1);
  const sort = (["newest", "most-replies", "most-views"].includes(sortStr ?? "")
    ? sortStr
    : "newest") as ThreadSort;
  const limit = 20;

  const [categories, threads, totalCount, activePilots, topContributors, recentActivity, mission] =
    await Promise.all([
      getCategories(),
      getThreads(page, limit, sort),
      getThreadCount(),
      getActivePilots(5),
      getTopContributors(5),
      getRecentActivity(8),
      getActiveMission(),
    ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <div className="relative min-h-screen">
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/forum-bg.jpg')" }}
      />
      <div className="fixed inset-0 -z-10 bg-black/60" />
      <ForumFeed
        categories={categories}
        threads={threads}
        currentPage={page}
        totalPages={totalPages}
        sort={sort}
        activePilots={activePilots}
        topContributors={topContributors}
        recentActivity={recentActivity}
        mission={mission}
      />
    </div>
  );
}
