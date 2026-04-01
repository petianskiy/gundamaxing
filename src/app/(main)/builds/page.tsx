import { getBuilds } from "@/lib/data/builds";
import { getUserLikedBuildIds, getUserBookmarkedBuildIds } from "@/lib/data/likes";
import { auth } from "@/lib/auth";
import { BuildsFeed } from "./builds-feed";

export const metadata = {
  title: "Builds | Gundamaxing",
  description: "Browse custom Gunpla builds from the community — filter by grade, technique, and more.",
};

export default async function BuildsPage() {
  const [initialBuilds, session] = await Promise.all([getBuilds(40), auth()]);
  const currentUserId = session?.user?.id;

  const [likedIds, bookmarkedIds] = currentUserId
    ? await Promise.all([
        getUserLikedBuildIds(currentUserId),
        getUserBookmarkedBuildIds(currentUserId),
      ])
    : [new Set<string>(), new Set<string>()];

  // Cursor for next page (last build's ID if we got a full page)
  const initialCursor = initialBuilds.length >= 40 ? initialBuilds[initialBuilds.length - 1].id : null;

  return (
    <div className="relative min-h-screen">
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/builds-bg.jpg')" }}
      />
      <div className="fixed inset-0 -z-10 bg-black/60" />
      <BuildsFeed
        builds={initialBuilds}
        currentUserId={currentUserId}
        likedBuildIds={Array.from(likedIds)}
        bookmarkedBuildIds={Array.from(bookmarkedIds)}
        initialCursor={initialCursor}
      />
    </div>
  );
}
