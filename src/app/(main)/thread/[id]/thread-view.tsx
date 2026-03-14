"use client";

import { useState, useTransition } from "react";
import { SmartImage as Image } from "@/components/ui/smart-image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Pin, Lock, MessageSquare, Eye, ThumbsUp, Reply, Trash2,
  ChevronRight, Shield,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { CommentForm } from "@/components/comments/comment-form";
import { GifDisplay } from "@/components/gifs/gif-display";
import { toggleLike } from "@/lib/actions/like";
import { deleteComment } from "@/lib/actions/comment";
import { togglePinThread, toggleLockThread, deleteThread } from "@/lib/actions/thread";
import type { Thread, Comment } from "@/lib/types";

// URL detection regex
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
        className="inline-block bg-white/5 text-white/20 rounded px-1 select-none cursor-not-allowed text-[11px]"
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

/* ─── Comment ─────────────────────────────────────────────────── */

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
    setLiked(!liked);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
    startTransition(async () => {
      const result = await toggleLike(undefined, comment.id);
      if (result.error) {
        setLiked(liked);
        setLikeCount(comment.likes);
      }
    });
  }

  function handleDelete() {
    if (!confirm(t("forum.deleteCommentConfirm"))) return;
    startTransition(async () => {
      const result = await deleteComment(comment.id);
      if (!result.error) router.refresh();
    });
  }

  const depthColors = ["border-white/[0.06]", "border-white/[0.04]", "border-white/[0.03]"];
  const borderColor = depthColors[Math.min(depth, 2)];

  return (
    <div>
      <div
        className={`relative ${
          depth > 0
            ? `ml-5 sm:ml-10 pl-4 border-l-2 ${borderColor}`
            : ""
        }`}
      >
        <div className="py-5">
          {/* Author row */}
          <div className="flex items-center gap-3 mb-3">
            <Link
              href={`/u/${comment.userHandle}`}
              className="relative flex-shrink-0 group/avatar"
            >
              <div
                className="relative rounded-full overflow-hidden ring-1 ring-white/10 group-hover/avatar:ring-white/25 transition-all"
                style={{ width: depth > 0 ? 28 : 34, height: depth > 0 ? 28 : 34 }}
              >
                <Image
                  src={comment.userAvatar}
                  alt={comment.username}
                  fill
                  className="object-cover"
                />
              </div>
            </Link>

            <div className="flex items-center gap-2 min-w-0">
              <Link
                href={`/u/${comment.userHandle}`}
                className="text-[13px] font-semibold text-white hover:text-gx-red transition-colors truncate"
              >
                {comment.username}
              </Link>
              <span className="text-[10px] font-share-tech-mono text-white/25 uppercase tracking-wider flex-shrink-0">
                {comment.createdAt}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="text-[13px] text-white/70 leading-[1.8] whitespace-pre-wrap break-words">
            {renderCommentContent(comment.content)}
          </div>

          {comment.gif && (
            <div className="mt-3">
              <GifDisplay gif={comment.gif} />
            </div>
          )}

          {/* Action bar */}
          <div className="flex items-center gap-4 mt-3">
            <button
              onClick={handleLike}
              disabled={!currentUserId || isPending}
              className={`flex items-center gap-1.5 text-[11px] font-share-tech-mono uppercase tracking-wider transition-colors ${
                liked
                  ? "text-gx-red"
                  : "text-white/25 hover:text-white/50"
              } disabled:opacity-30`}
            >
              <ThumbsUp className="h-3 w-3" />
              {likeCount}
            </button>

            {canReply && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="flex items-center gap-1.5 text-[11px] font-share-tech-mono uppercase tracking-wider text-white/25 hover:text-white/50 transition-colors"
              >
                <Reply className="h-3 w-3" />
                {t("forum.reply")}
              </button>
            )}

            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex items-center gap-1.5 text-[11px] font-share-tech-mono uppercase tracking-wider text-white/25 hover:text-red-400 transition-colors disabled:opacity-30 ml-auto"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Inline reply form */}
          {showReplyForm && (
            <div className="mt-4">
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

/* ─── Thread View ─────────────────────────────────────────────── */

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
      if (!result.error) router.push("/forum");
    });
  }

  return (
    <div className="relative min-h-screen">
      {/* Forum background */}
      <div className="fixed inset-0 -z-20">
        <Image
          src="/images/forum-bg.jpg"
          alt=""
          fill
          className="object-cover object-center"
          priority
        />
      </div>
      <div className="fixed inset-0 -z-10 bg-black/65" />

      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[860px]">

          {/* ── Breadcrumb ── */}
          <div className="flex items-center gap-1.5 text-[11px] font-share-tech-mono text-white/30 mb-8">
            <Link href="/forum" className="hover:text-white/60 transition-colors uppercase tracking-wider">
              Forum
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link
              href={`/forum/category/${thread.categoryId}`}
              className="hover:text-white/60 transition-colors uppercase tracking-wider"
            >
              {thread.categoryName}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white/50 truncate max-w-[200px]">{thread.title}</span>
          </div>

          {/* ── Mod controls ── */}
          {(isMod || isOwner) && (
            <div className="flex items-center gap-2 mb-5 p-3 bg-white/[0.03] border border-white/[0.06]">
              <Shield className="h-3.5 w-3.5 text-white/30 mr-1" />
              {isMod && (
                <>
                  <button
                    onClick={handlePin}
                    disabled={isPending}
                    className="px-2.5 py-1 text-[10px] font-share-tech-mono uppercase tracking-wider text-white/50 border border-white/10 hover:bg-white/5 hover:text-white/80 transition-all disabled:opacity-30"
                  >
                    {thread.isPinned ? t("forum.unpin") : t("forum.pin")}
                  </button>
                  <button
                    onClick={handleLock}
                    disabled={isPending}
                    className="px-2.5 py-1 text-[10px] font-share-tech-mono uppercase tracking-wider text-white/50 border border-white/10 hover:bg-white/5 hover:text-white/80 transition-all disabled:opacity-30"
                  >
                    {thread.isLocked ? t("forum.unlock") : t("forum.lock")}
                  </button>
                </>
              )}
              <button
                onClick={handleDeleteThread}
                disabled={isPending}
                className="px-2.5 py-1 text-[10px] font-share-tech-mono uppercase tracking-wider text-red-400/70 border border-red-500/20 hover:bg-red-500/10 hover:text-red-400 transition-all disabled:opacity-30 ml-auto"
              >
                {t("forum.deleteThread")}
              </button>
            </div>
          )}

          {/* ── Locked banner ── */}
          {thread.isLocked && (
            <div className="flex items-center gap-2 mb-5 p-3 bg-orange-500/5 border border-orange-500/15 text-[11px] font-share-tech-mono uppercase tracking-wider text-orange-400/80">
              <Lock className="h-3.5 w-3.5 flex-shrink-0" />
              {t("forum.threadLocked")}
            </div>
          )}

          {/* ── Thread Header ── */}
          <header className="mb-8">
            {/* Badges */}
            <div className="flex items-center gap-2 mb-3">
              {thread.isPinned && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-share-tech-mono font-bold uppercase tracking-[0.15em] bg-yellow-500/10 text-yellow-500/80 border border-yellow-500/15">
                  <Pin className="h-2.5 w-2.5" />
                  Pinned
                </span>
              )}
              {thread.isLocked && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-share-tech-mono font-bold uppercase tracking-[0.15em] bg-orange-500/10 text-orange-400/80 border border-orange-500/15">
                  <Lock className="h-2.5 w-2.5" />
                  Locked
                </span>
              )}
              <Link
                href={`/forum/category/${thread.categoryId}`}
                className="px-2 py-0.5 text-[9px] font-share-tech-mono font-bold uppercase tracking-[0.15em] bg-gx-red/10 text-gx-red/70 border border-gx-red/15 hover:text-gx-red hover:border-gx-red/30 transition-colors"
              >
                {thread.categoryName}
              </Link>
            </div>

            {/* Title */}
            <h1 className="font-orbitron text-xl sm:text-2xl lg:text-[28px] font-bold text-white tracking-tight leading-tight">
              {thread.title}
            </h1>
          </header>

          {/* ── Original Post ── */}
          <article className="relative border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
            {/* Top accent bar */}
            <div className="h-[2px] bg-gradient-to-r from-gx-red via-gx-red/40 to-transparent" />

            <div className="p-5 sm:p-7">
              {/* Author row */}
              <div className="flex items-center gap-3 mb-6">
                <Link href={`/u/${thread.userHandle}`} className="group/avatar flex-shrink-0">
                  <div className="relative w-11 h-11 rounded-full overflow-hidden ring-2 ring-white/10 group-hover/avatar:ring-gx-red/40 transition-all">
                    <Image
                      src={thread.userAvatar}
                      alt={thread.username}
                      fill
                      className="object-cover"
                    />
                  </div>
                </Link>
                <div>
                  <Link
                    href={`/u/${thread.userHandle}`}
                    className="text-[13px] font-semibold text-white hover:text-gx-red transition-colors"
                  >
                    {thread.username}
                  </Link>
                  <div className="flex items-center gap-2 text-[10px] font-share-tech-mono text-white/25 uppercase tracking-wider mt-0.5">
                    <span>{thread.createdAt}</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="text-[14px] text-white/75 leading-[1.9] whitespace-pre-wrap break-words">
                {renderCommentContent(thread.content)}
              </div>

              {thread.gif && (
                <div className="mt-5">
                  <GifDisplay gif={thread.gif} />
                </div>
              )}

              {/* Stats footer */}
              <div className="flex items-center gap-5 mt-8 pt-5 border-t border-white/[0.06]">
                <div className="flex items-center gap-1.5 text-[11px] font-share-tech-mono text-white/30">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="text-white/50">{thread.replies}</span>
                  <span className="uppercase tracking-wider">{t("shared.replies")}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-share-tech-mono text-white/30">
                  <Eye className="h-3.5 w-3.5" />
                  <span className="text-white/50">{thread.views.toLocaleString()}</span>
                  <span className="uppercase tracking-wider">{t("shared.views")}</span>
                </div>
              </div>
            </div>
          </article>

          {/* ── Comments Section ── */}
          <section className="mt-10">
            {/* Section divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-gx-red/40 to-transparent" />
              <h2 className="font-orbitron text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
                {t("forum.repliesSection")}
                <span className="text-gx-red/60 ml-2">{thread.replies}</span>
              </h2>
              <div className="h-px flex-1 bg-gradient-to-l from-gx-red/40 to-transparent" />
            </div>

            {comments.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-[12px] font-share-tech-mono text-white/20 uppercase tracking-wider">
                  {t("forum.noReplies")}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
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
              <div className="mt-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                  <span className="font-orbitron text-[9px] font-bold uppercase tracking-[0.25em] text-white/25">
                    Post Reply
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent" />
                </div>
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
    </div>
  );
}
