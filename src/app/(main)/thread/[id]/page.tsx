import { notFound } from "next/navigation";
import { getThreadById } from "@/lib/data/threads";
import { getCommentsByThreadId } from "@/lib/data/comments";
import { ThreadView } from "./thread-view";

type Props = { params: Promise<{ id: string }> };

export default async function ThreadPage({ params }: Props) {
  const { id } = await params;
  const thread = await getThreadById(id);
  if (!thread) notFound();

  const comments = await getCommentsByThreadId(id);
  return <ThreadView thread={thread} comments={comments} />;
}
