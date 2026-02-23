import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getThreadById } from "@/lib/data/threads";
import { getCommentsByThreadId } from "@/lib/data/comments";
import { ThreadView } from "./thread-view";

type Props = { params: Promise<{ id: string }> };

export default async function ThreadPage({ params }: Props) {
  const { id } = await params;
  const thread = await getThreadById(id);
  if (!thread) notFound();

  const session = await auth();
  const comments = await getCommentsByThreadId(id);

  // Get current user's liked comment IDs for this thread
  let likedCommentIds: string[] = [];
  let userRole: string | null = null;

  if (session?.user?.id) {
    const [likes, user] = await Promise.all([
      db.like.findMany({
        where: {
          userId: session.user.id,
          commentId: { not: null },
          comment: { threadId: id },
        },
        select: { commentId: true },
      }),
      db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      }),
    ]);
    likedCommentIds = likes.map((l) => l.commentId).filter(Boolean) as string[];
    userRole = user?.role ?? null;
  }

  return (
    <ThreadView
      thread={thread}
      comments={comments}
      currentUserId={session?.user?.id ?? null}
      userRole={userRole}
      likedCommentIds={likedCommentIds}
    />
  );
}
