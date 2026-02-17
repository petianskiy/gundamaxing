import { notFound } from "next/navigation";
import { getBuildById, getBuilds } from "@/lib/data/builds";
import { getCommentsByBuildId } from "@/lib/data/comments";
import { BuildPassport } from "./build-passport";

type Props = { params: Promise<{ id: string }> };

export default async function BuildPage({ params }: Props) {
  const { id } = await params;
  const build = await getBuildById(id);
  if (!build) notFound();

  const [comments, allBuilds] = await Promise.all([
    getCommentsByBuildId(id),
    getBuilds(),
  ]);

  return <BuildPassport build={build} comments={comments} allBuilds={allBuilds} />;
}
