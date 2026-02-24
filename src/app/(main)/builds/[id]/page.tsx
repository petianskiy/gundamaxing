import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBuildById, getBuilds, getOtherBuildsByUser } from "@/lib/data/builds";
import { getCommentsByBuildId } from "@/lib/data/comments";
import { getUserLikeForBuild, getUserBookmarkForBuild, getUserCommentLikes } from "@/lib/data/likes";
import { BuildPassport } from "./build-passport";
import { ShowcasePage } from "@/components/build/showcase/showcase-page";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string; guide?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const build = await getBuildById(id);

  if (!build) {
    return { title: "Build Not Found | Gundamaxing" };
  }

  const description = build.intentStatement
    ? build.intentStatement
    : `${build.grade} ${build.kitName} by ${build.username}${build.techniques.length > 0 ? ". " + build.techniques.join(", ") : ""}`;

  const primaryImage = build.images.find((img) => img.isPrimary) ?? build.images[0];

  return {
    title: `${build.title} — ${build.kitName} | Gundamaxing`,
    description,
    openGraph: {
      title: `${build.title} — ${build.kitName} | Gundamaxing`,
      description,
      images: primaryImage ? [{ url: primaryImage.url }] : undefined,
    },
    twitter: {
      card: primaryImage ? "summary_large_image" : "summary",
      title: `${build.title} — ${build.kitName} | Gundamaxing`,
      description,
      images: primaryImage ? [primaryImage.url] : undefined,
    },
  };
}

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
  // Also fetch user level for showcase page limit gating
  let showGuide = false;
  let userLevel = 1;
  if (isOwner && currentUserId) {
    const userData = await db.user.findUnique({
      where: { id: currentUserId },
      select: { editorGuideSeen: true, level: true },
    });
    if (wantsGuide) {
      showGuide = !(userData?.editorGuideSeen);
    }
    userLevel = userData?.level ?? 1;
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
        userLevel={userLevel}
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
