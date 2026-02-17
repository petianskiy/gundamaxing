"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ThumbsUp, MessageSquare, Flag, Trash2, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toggleLike } from "@/lib/actions/like";
import { deleteComment } from "@/lib/actions/comment";
import { CommentForm } from "./comment-form";

interface CommentData {
  id: string;
  content: string;
  userId: string;
  username: string;
  userHandle: string;
  userAvatar: string | null;
  likeCount: number;
  liked: boolean;
  flagged: boolean;
  createdAt: string;
  children?: CommentData[];
}

interface CommentItemProps {
  comment: CommentData;
  depth?: number;
  buildId?: string;
  threadId?: string;
  onUpdate?: () => void;
}

export function CommentItem({ comment, depth = 0, buildId, threadId, onUpdate }: CommentItemProps) {
  const { data: session } = useSession();
  const [liked, setLiked] = useState(comment.liked);
  const [likeCount, setLikeCount] = useState(comment.likeCount);
  const [showReply, setShowReply] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = session?.user?.id === comment.userId;
  const isMod = session?.user?.role === "ADMIN" || session?.user?.role === "MODERATOR";
  const size = depth > 0 ? 28 : 32;

  async function handleLike() {
    if (!session?.user) return;
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    const result = await toggleLike(undefined, comment.id);
    if ("liked" in result && result.liked !== !liked) {
      setLiked(result.liked ?? false);
      setLikeCount(result.liked ? likeCount + 1 : likeCount);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this comment?")) return;
    setDeleting(true);
    await deleteComment(comment.id);
    onUpdate?.();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(depth > 0 && "ml-8 mt-3")}
    >
      <div className={cn("flex gap-3", comment.flagged && "opacity-60")}>
        <div
          className="relative rounded-full overflow-hidden flex-shrink-0"
          style={{ width: size, height: size }}
        >
          {comment.userAvatar ? (
            <Image src={comment.userAvatar} alt={comment.username} fill className="object-cover" unoptimized />
          ) : (
            <div className="w-full h-full bg-gx-red/20 rounded-full" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/u/${comment.userHandle}`} className="text-sm font-medium text-foreground hover:underline">
              {comment.username}
            </Link>
            <span className="text-xs text-muted-foreground">{comment.createdAt}</span>
            {comment.flagged && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                Under review
              </span>
            )}
          </div>

          <p className="text-sm text-zinc-300 leading-relaxed">{comment.content}</p>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={handleLike}
              className={cn(
                "flex items-center gap-1 text-xs transition-colors",
                liked ? "text-gx-red" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ThumbsUp className="h-3 w-3" />
              {likeCount > 0 && likeCount}
            </button>

            {session?.user && (
              <button
                onClick={() => setShowReply(!showReply)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageSquare className="h-3 w-3" />
                Reply
              </button>
            )}

            {(isOwner || isMod) && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </button>
                {showMenu && (
                  <div className="absolute left-0 top-5 z-10 rounded-lg border border-border/50 bg-card shadow-lg py-1 min-w-[120px]">
                    {session?.user && !isOwner && (
                      <button className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50">
                        <Flag className="h-3 w-3" />
                        Report
                      </button>
                    )}
                    {(isOwner || isMod) && (
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-400 hover:bg-muted/50"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reply form */}
          {showReply && depth < 3 && (
            <div className="mt-3">
              <CommentForm
                buildId={buildId}
                threadId={threadId}
                parentId={comment.id}
                autoFocus
                placeholder={`Reply to ${comment.username}...`}
                onSuccess={() => {
                  setShowReply(false);
                  onUpdate?.();
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {comment.children?.map((child) => (
        <CommentItem
          key={child.id}
          comment={child}
          depth={depth + 1}
          buildId={buildId}
          threadId={threadId}
          onUpdate={onUpdate}
        />
      ))}
    </motion.div>
  );
}
