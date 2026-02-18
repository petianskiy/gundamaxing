"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Pencil,
  Heart,
  Bookmark,
  GitFork,
  Share2,
  MessageCircle,
  ThumbsUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { ShowcaseCanvas } from "./showcase-canvas";
import { ShowcaseEditor } from "./showcase-editor";
import type { Build, Comment, ShowcaseLayout } from "@/lib/types";

interface ShowcasePageProps {
  build: Build;
  comments: Comment[];
  allBuilds: Build[];
  currentUserId?: string;
}

function CommentItem({ comment, depth = 0 }: { comment: Comment; depth?: number }) {
  const size = depth > 0 ? 28 : 32;
  return (
    <div className={cn("flex gap-3", depth > 0 && "ml-8 mt-3")}>
      <div
        className="relative rounded-full overflow-hidden flex-shrink-0"
        style={{ width: size, height: size }}
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
          <Link href={`/u/${comment.username}`} className="text-sm font-medium text-foreground hover:underline">
            {comment.username}
          </Link>
          <span className="text-xs text-muted-foreground">{comment.createdAt}</span>
        </div>
        <p className="text-sm text-zinc-300 leading-relaxed">{comment.content}</p>
        <button className="flex items-center gap-1 mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ThumbsUp className="h-3 w-3" />
          {comment.likes}
        </button>
        {comment.children?.map((child) => (
          <CommentItem key={child.id} comment={child} depth={depth + 1} />
        ))}
      </div>
    </div>
  );
}

export function ShowcasePage({ build, comments, currentUserId }: ShowcasePageProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const isOwner = currentUserId === build.userId;
  const layout = build.showcaseLayout as ShowcaseLayout;

  const handleExit = useCallback(() => {
    setIsEditing(false);
    window.location.reload();
  }, []);

  if (isEditing && isOwner) {
    return (
      <div className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <ShowcaseEditor
            build={build}
            initialLayout={layout}
            onExit={handleExit}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-16">
      {/* Canvas — full width */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative">
          <ShowcaseCanvas layout={layout} build={build} />

          {/* Edit button for owner */}
          {isOwner && (
            <button
              onClick={() => setIsEditing(true)}
              className="absolute top-4 right-4 z-20 flex items-center gap-2 px-4 py-2 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-white text-sm font-medium hover:bg-black/80 transition-colors"
            >
              <Pencil className="h-4 w-4" />
              Edit Showcase
            </button>
          )}
        </div>
      </div>

      {/* Below canvas content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Actions bar */}
        <div className="flex items-center gap-2 mt-8 p-3 rounded-xl border border-border/50 bg-card">
          {[
            { icon: Heart, label: t("builds.like"), count: build.likes },
            { icon: Bookmark, label: t("builds.bookmark"), count: build.bookmarks },
            { icon: GitFork, label: t("builds.fork"), count: build.forkCount },
            { icon: Share2, label: t("builds.share"), count: null },
          ].map((action) => (
            <button
              key={action.label}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <action.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{action.label}</span>
              {action.count !== null && (
                <span className="text-xs text-muted-foreground">
                  {action.count >= 1000 ? `${(action.count / 1000).toFixed(1)}k` : action.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Metadata strip if not on canvas */}
        {!layout.elements.some((el) => el.type === "metadata") && (
          <div className="mt-6 rounded-xl border border-border/50 bg-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-xl font-bold text-foreground">{build.title}</h2>
              <span className="text-sm text-muted-foreground">{build.grade} &middot; {build.scale}</span>
            </div>
            <p className="text-sm text-muted-foreground">{build.kitName}</p>
            {build.techniques.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {build.techniques.map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Builder */}
        <div className="mt-6 flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-card">
          <div className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={build.userAvatar}
              alt={build.username}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div>
            <Link href={`/u/${build.username}`} className="text-sm font-medium text-foreground hover:underline">
              {build.username}
            </Link>
            <p className="text-xs text-muted-foreground">Posted {build.createdAt}</p>
          </div>
          <VerificationBadge tier={build.verification} showLabel size="sm" />
        </div>

        {/* Comments */}
        <section className="mt-8">
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {t("builds.comments")} ({build.comments})
          </h2>

          {/* Write comment */}
          <div className="mb-6 rounded-xl border border-border/50 bg-card p-4">
            <textarea
              placeholder={t("builds.commentPlaceholder")}
              disabled
              className="w-full bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground/60 resize-none h-20 focus:outline-none"
            />
            <div className="flex justify-end">
              <button
                disabled
                className="px-4 py-1.5 rounded-lg bg-gx-red/50 text-white/50 text-sm font-medium cursor-not-allowed"
              >
                {t("builds.postComment")}
              </button>
            </div>
          </div>

          {/* Comments list */}
          <div className="space-y-6">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
