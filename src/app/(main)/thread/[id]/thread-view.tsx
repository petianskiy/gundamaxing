"use client";

import Image from "next/image";
import Link from "next/link";
import { Pin, MessageSquare, Eye, ThumbsUp } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import type { Thread, Comment } from "@/lib/types";

function CommentItem({ comment, depth = 0 }: { comment: Comment; depth?: number }) {
  return (
    <div className={depth > 0 ? "ml-8 mt-4" : ""}>
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
          <p className="text-sm text-zinc-300 leading-relaxed">{comment.content}</p>
          <button className="flex items-center gap-1 mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ThumbsUp className="h-3 w-3" />
            {comment.likes}
          </button>
        </div>
      </div>
      {comment.children?.map((child) => (
        <CommentItem key={child.id} comment={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export function ThreadView({
  thread,
  comments,
}: {
  thread: Thread;
  comments: Comment[];
}) {
  const { t } = useTranslation();

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <Link href="/forum" className="hover:text-foreground transition-colors">{t("forum.title")}</Link>
          <span>/</span>
          <span>{thread.categoryName}</span>
        </div>

        {/* Thread header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            {thread.isPinned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                <Pin className="h-2.5 w-2.5" />
                {t("forum.pinned")}
              </span>
            )}
            <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-medium">
              {thread.categoryName}
            </span>
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
            {thread.content.split("\n").map((paragraph, i) => (
              <p key={i} className="text-sm text-zinc-300 leading-relaxed mb-3">
                {paragraph}
              </p>
            ))}
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

          <div className="space-y-6">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>

          {/* Reply box */}
          <div className="mt-8 rounded-xl border border-border/50 bg-card p-4">
            <textarea
              placeholder={t("forum.replyPlaceholder")}
              disabled
              className="w-full bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground/60 resize-none h-24 focus:outline-none"
            />
            <div className="flex justify-end">
              <button
                disabled
                className="px-4 py-1.5 rounded-lg bg-gx-red/50 text-white/50 text-sm font-medium cursor-not-allowed"
              >
                {t("forum.postReply")}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
