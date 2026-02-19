import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getBookmarkedBuilds } from "@/lib/data/bookmarks";
import { BookmarksPage } from "./bookmarks-page";

export default async function BookmarksRoute() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const builds = await getBookmarkedBuilds(session.user.id);

  return <BookmarksPage builds={builds} />;
}
