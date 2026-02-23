"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pin, Lock, MessageSquare, Eye, ThumbsUp, Reply, Trash2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { CommentForm } from "@/components/comments/comment-form";
import { toggleLike } from "@/lib/actions/like";
import { deleteComment } from "@/lib/actions/comment";
import { togglePinThread, toggleLockThread, deleteThread } from "@/lib/actions/thread";
import type { Thread, Comment } from "@/lib/types";

// URL detection regex — matches http(s)://, www., and bare domains ending in common TLDs
const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s]+|[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\/[^\s]*)?/gi;

function renderCommentContent(text: string) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(URL_PATTERN.source, "gi");

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <span
        key={match.index}
        className="inline-block bg-zinc-700 text-zinc-700 rounded px-1 select-none cursor-not-allowed"
        title="Link removed for security"
        aria-label="Redacted link"
      >
        {"[link removed]"}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

function CommentItem({
  comment,
  depth = 0,
  threadId,
  isLocked,
  currentUserId,
  userRole,
  likedCommentIds,
}: {
  comment: Comment;
  depth?: number;
  threadId: string;
  isLocked: boolean;
  currentUserId: string | null;
  userRole: string | null;
  likedCommentIds: string[];
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [liked, setLiked] = useState(likedCommentIds.includes(comment.id));
  const [likeCount, setLikeCount] = useState(comment.likes);
  const [isPending, startTransition] = useTransition();

  const isOwn = currentUserId === comment.userId;
  const isMod = userRole === "ADMIN" || userRole === "MODERATOR";
  const canDelete = isOwn || isMod;
  const canReply = !!currentUserId && !isLocked && depth < 2;

  function handleLike() {
    if (!currentUserId) return;
    // Optimistic update
    setLiked(!liked);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
    startTransition(async () => {
      const result = await toggleLike(undefined, comment.id);
      if (result.error) {
        // Revert
        setLiked(liked);
        setLikeCount(comment.likes);
      }
    });
  }

  function handleDelete() {
    if (!confirm(t("forum.deleteCommentConfirm"))) return;
    startTransition(async () => {
      const result = await deleteComment(comment.id);
      if (!result.error) {
        router.refresh();
      }
    });
  }

  return (
    <div className={depth > 0 ? "ml-4 sm:ml-8 mt-4" : ""}>
      <div className="flex gap-3">
        <div
          className="relative rounded-full overflow-hidden flex-shrink-0"
          style={{ width: depth > 0 ? 28 : 32, height: depth > 0 ? 28 : 32 }}
        >
          <Image
            src={comment.userAvatar}
            alt={comment.username}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/u/${comment.userHandle}`} className="text-sm font-medium text-foreground hover:underline">
              {comment.username}
            </Link>
            <span className="text-xs text-muted-foreground">{comment.createdAt}</span>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap break-words font-mono">{renderCommentContent(comment.content)}</p>

          {/* Action bar */}
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={handleLike}
              disabled={!currentUserId || isPending}
              className={`flex items-center gap-1 text-xs transition-colors ${
                liked
                  ? "text-gx-red"
                  : "text-muted-foreground hover:text-foreground"
              } disabled:opacity-50`}
            >
              <ThumbsUp className="h-3 w-3" />
              {likeCount}
            </button>

            {canReply && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Reply className="h-3 w-3" />
                {t("forum.reply")}
              </button>
            )}

            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" />
                {t("forum.deleteComment")}
              </button>
            )}
          </div>

          {/* Inline reply form */}
          {showReplyForm && (
            <div className="mt-3">
              <CommentForm
                threadId={threadId}
                parentId={comment.id}
                autoFocus
                placeholder={t("forum.replyTo", { name: comment.username })}
                onSuccess={() => {
                  setShowReplyForm(false);
                  router.refresh();
                }}
              />
            </div>
          )}
        </div>
      </div>
      {comment.children?.map((child) => (
        <CommentItem
          key={child.id}
          comment={child}
          depth={depth + 1}
          threadId={threadId}
          isLocked={isLocked}
          currentUserId={currentUserId}
          userRole={userRole}
          likedCommentIds={likedCommentIds}
        />
      ))}
    </div>
  );
}

export function ThreadView({
  thread,
  comments,
  currentUserId,
  userRole,
  likedCommentIds,
}: {
  thread: Thread;
  comments: Comment[];
  currentUserId: string | null;
  userRole: string | null;
  likedCommentIds: string[];
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isMod = userRole === "ADMIN" || userRole === "MODERATOR";
  const isOwner = currentUserId === thread.userId;

  function handlePin() {
    startTransition(async () => {
      await togglePinThread(thread.id);
      router.refresh();
    });
  }

  function handleLock() {
    startTransition(async () => {
      await toggleLockThread(thread.id);
      router.refresh();
    });
  }

  function handleDeleteThread() {
    if (!confirm(t("forum.deleteThreadConfirm"))) return;
    startTransition(async () => {
      const result = await deleteThread(thread.id);
      if (!result.error) {
        router.push("/forum");
      }
    });
  }

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <Link href="/forum" className="hover:text-foreground transition-colors">{t("forum.title")}</Link>
          <span>/</span>
          <Link
            href={`/forum/category/${thread.categoryId}`}
            className="hover:text-foreground transition-colors"
          >
            {thread.categoryName}
          </Link>
        </div>

        {/* Mod controls */}
        {(isMod || isOwner) && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-muted/50 border border-border/50">
            {isMod && (
              <>
                <button
                  onClick={handlePin}
                  disabled={isPending}
                  className="px-2.5 py-1 rounded text-xs font-medium border border-border/50 hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {thread.isPinned ? t("forum.unpin") : t("forum.pin")}
                </button>
                <button
                  onClick={handleLock}
                  disabled={isPending}
                  className="px-2.5 py-1 rounded text-xs font-medium border border-border/50 hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {thread.isLocked ? t("forum.unlock") : t("forum.lock")}
                </button>
              </>
            )}
            <button
              onClick={handleDeleteThread}
              disabled={isPending}
              className="px-2.5 py-1 rounded text-xs font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 ml-auto"
            >
              {t("forum.deleteThread")}
            </button>
          </div>
        )}

        {/* Locked banner */}
        {thread.isLocked && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs">
            <Lock className="h-3.5 w-3.5 flex-shrink-0" />
            {t("forum.threadLocked")}
          </div>
        )}

        {/* Thread header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            {thread.isPinned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                <Pin className="h-2.5 w-2.5" />
                {t("forum.pinned")}
              </span>
            )}
            {thread.isLocked && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <Lock className="h-2.5 w-2.5" />
                {t("forum.locked")}
              </span>
            )}
            <Link
              href={`/forum/category/${thread.categoryId}`}
              className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-medium hover:text-foreground transition-colors"
            >
              {thread.categoryName}
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            {thread.title}
          </h1>
        </div>

        {/* Thread content */}
        <article className="rounded-xl border border-border/50 bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              <Image
                src={thread.userAvatar}
                alt={thread.username}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div>
              <Link href={`/u/${thread.userHandle}`} className="text-sm font-semibold text-foreground hover:underline">
                {thread.username}
              </Link>
              <p className="text-xs text-muted-foreground">{thread.createdAt}</p>
            </div>
          </div>

          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap break-words">
              {renderCommentContent(thread.content)}
            </p>
          </div>

          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-border/50 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {thread.replies} {t("shared.replies")}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {thread.views.toLocaleString()} {t("shared.views")}
            </span>
          </div>
        </article>

        {/* Comments */}
        <section className="mt-8">
          <h2 className="text-lg font-bold text-foreground mb-6">
            {t("forum.repliesSection")} ({thread.replies})
          </h2>

          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {t("forum.noReplies")}
            </p>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  threadId={thread.id}
                  isLocked={thread.isLocked}
                  currentUserId={currentUserId}
                  userRole={userRole}
                  likedCommentIds={likedCommentIds}
                />
              ))}
            </div>
          )}

          {/* Reply form */}
          {!thread.isLocked && (
            <div className="mt-8">
              <CommentForm
                threadId={thread.id}
                placeholder={t("forum.replyPlaceholder")}
                onSuccess={() => router.refresh()}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
