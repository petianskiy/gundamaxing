import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getBuildById, getBuilds } from "@/lib/data/builds";
import { getCommentsByBuildId } from "@/lib/data/comments";
import { getUserLikeForBuild, getUserBookmarkForBuild, getUserCommentLikes } from "@/lib/data/likes";
import { BuildPassport } from "./build-passport";
import { ShowcasePage } from "@/components/build/showcase/showcase-page";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
};

export default async function BuildPage({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const build = await getBuildById(id);
  if (!build) notFound();

  const [comments, allBuilds, session] = await Promise.all([
    getCommentsByBuildId(id),
    getBuilds(),
    auth(),
  ]);

  const currentUserId = session?.user?.id;
  const isOwner = currentUserId === build.userId;
  const wantsEdit = sp.edit === "1";

  // Fetch engagement status if logged in
  const [isLiked, isBookmarked, likedCommentIds] = currentUserId
    ? await Promise.all([
        getUserLikeForBuild(currentUserId, id),
        getUserBookmarkForBuild(currentUserId, id),
        getUserCommentLikes(currentUserId, id),
      ])
    : [false, false, [] as string[]];

  // If owner opened with ?edit=1, go directly to showcase editor
  if ((build.showcaseLayout || (wantsEdit && isOwner))) {
    return (
      <ShowcasePage
        build={build}
        comments={comments}
        allBuilds={allBuilds}
        currentUserId={currentUserId}
        isLiked={isLiked}
        isBookmarked={isBookmarked}
        likedCommentIds={likedCommentIds}
        startEditing={wantsEdit && isOwner}
      />
    );
  }

  return (
    <BuildPassport
      build={build}
      comments={comments}
      allBuilds={allBuilds}
      currentUserId={currentUserId}
      isLiked={isLiked}
      isBookmarked={isBookmarked}
      likedCommentIds={likedCommentIds}
    />
  );
}
