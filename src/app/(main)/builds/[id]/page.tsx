import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBuildById, getBuilds, getOtherBuildsByUser } from "@/lib/data/builds";
import { getCommentsByBuildId } from "@/lib/data/comments";
import { getUserLikeForBuild, getUserBookmarkForBuild, getUserCommentLikes } from "@/lib/data/likes";
import { BuildPassport } from "./build-passport";
import { ShowcasePage } from "@/components/build/showcase/showcase-page";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string; guide?: string }>;
};

export default async function BuildPage({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const build = await getBuildById(id);
  if (!build) notFound();

  const buildId = build.id;

  const [comments, allBuilds, session, authorBuilds] = await Promise.all([
    getCommentsByBuildId(buildId),
    getBuilds(),
    auth(),
    getOtherBuildsByUser(build.userId, buildId),
  ]);

  const currentUserId = session?.user?.id;
  const isOwner = currentUserId === build.userId;
  const wantsEdit = sp.edit === "1";
  const wantsGuide = sp.guide === "1";

  // Fetch engagement status if logged in
  const [isLiked, isBookmarked, likedCommentIds] = currentUserId
    ? await Promise.all([
        getUserLikeForBuild(currentUserId, buildId),
        getUserBookmarkForBuild(currentUserId, buildId),
        getUserCommentLikes(currentUserId, buildId),
      ])
    : [false, false, [] as string[]];

  // Check if editor guide should be shown (first build, not yet seen)
  let showGuide = false;
  if (wantsGuide && isOwner && currentUserId) {
    const userData = await db.user.findUnique({
      where: { id: currentUserId },
      select: { editorGuideSeen: true },
    });
    showGuide = !(userData?.editorGuideSeen);
  }

  // If owner opened with ?edit=1, go directly to showcase editor
  if ((build.showcaseLayout || (wantsEdit && isOwner))) {
    return (
      <ShowcasePage
        build={build}
        comments={comments}
        allBuilds={allBuilds}
        authorBuilds={authorBuilds}
        currentUserId={currentUserId}
        isLiked={isLiked}
        isBookmarked={isBookmarked}
        likedCommentIds={likedCommentIds}
        startEditing={wantsEdit && isOwner}
        showGuide={showGuide}
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
