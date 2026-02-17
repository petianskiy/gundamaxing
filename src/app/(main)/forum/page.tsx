import { getCategories } from "@/lib/data/categories";
import { getThreads } from "@/lib/data/threads";
import { ForumFeed } from "./forum-feed";

export default async function ForumPage() {
  const [categories, threads] = await Promise.all([
    getCategories(),
    getThreads(),
  ]);

  return <ForumFeed categories={categories} threads={threads} />;
}
