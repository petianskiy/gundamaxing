import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getBuildById, getBuilds } from "@/lib/data/builds";
import { getCommentsByBuildId } from "@/lib/data/comments";
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

  if (build.showcaseLayout) {
    return (
      <ShowcasePage
        build={build}
        comments={comments}
        allBuilds={allBuilds}
        currentUserId={session?.user?.id}
      />
    );
  }

  return (
    <BuildPassport
      build={build}
      comments={comments}
      allBuilds={allBuilds}
      currentUserId={session?.user?.id}
    />
  );
}
