"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { ShowcaseCanvas } from "./showcase-canvas";
import { ShowcaseEditor } from "./showcase-editor";
import { ActionsBar } from "@/components/build/actions-bar";
import { CommentSection } from "@/components/build/comment-section";
import type { Build, Comment, ShowcaseLayout } from "@/lib/types";

interface ShowcasePageProps {
  build: Build;
  comments: Comment[];
  allBuilds: Build[];
  currentUserId?: string;
  isLiked: boolean;
  isBookmarked: boolean;
  likedCommentIds: string[];
}

export function ShowcasePage({ build, comments, currentUserId, isLiked, isBookmarked, likedCommentIds }: ShowcasePageProps) {
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
        <div className="mt-8">
          <ActionsBar
            buildId={build.id}
            likeCount={build.likes}
            bookmarkCount={build.bookmarks}
            forkCount={build.forkCount}
            isLiked={isLiked}
            isBookmarked={isBookmarked}
            isOwner={isOwner}
            currentUserId={currentUserId}
          />
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
        <CommentSection
          buildId={build.id}
          comments={comments}
          commentCount={build.comments}
          currentUserId={currentUserId}
          buildOwnerId={build.userId}
          commentsEnabled={build.commentsEnabled}
          likedCommentIds={likedCommentIds}
        />
      </div>
    </div>
  );
}
