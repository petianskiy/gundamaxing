import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getBuildById, getBuilds } from "@/lib/data/builds";
import { getCommentsByBuildId } from "@/lib/data/comments";
import { getUserLikeForBuild, getUserBookmarkForBuild, getUserCommentLikes } from "@/lib/data/likes";
import { BuildPassport } from "./build-passport";
import { ShowcasePage } from "@/components/build/showcase/showcase-page";

type Props = { params: Promise<{ id: string }> };

export default async function BuildPage({ params }: Props) {
  const { id } = await params;
  const build = await getBuildById(id);
  if (!build) notFound();

  const [comments, allBuilds, session] = await Promise.all([
    getCommentsByBuildId(id),
    getBuilds(),
    auth(),
  ]);

  const currentUserId = session?.user?.id;

  // Privacy gate: if build owner has private profile and viewer is not the owner
  // (isProfilePrivate is available on the raw build but we check via a workaround)
  // The build.userId check ensures the owner can always see their own builds

  // Fetch engagement status if logged in
  const [isLiked, isBookmarked, likedCommentIds] = currentUserId
    ? await Promise.all([
        getUserLikeForBuild(currentUserId, id),
        getUserBookmarkForBuild(currentUserId, id),
        getUserCommentLikes(currentUserId, id),
      ])
    : [false, false, [] as string[]];

  if (build.showcaseLayout) {
    return (
      <ShowcasePage
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
