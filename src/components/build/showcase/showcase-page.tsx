"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pencil, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { BuildCard } from "@/components/build/build-card";
import { ShowcaseCanvas } from "./showcase-canvas";
import { ShowcaseEditor } from "./showcase-editor";
import { EditorGuideOverlay } from "./editor-guide-overlay";
import { ActionsBar } from "@/components/build/actions-bar";
import { CommentSection } from "@/components/build/comment-section";
import type { Build, Comment, ShowcaseLayout, ShowcasePage as ShowcasePageType } from "@/lib/types";

const DEFAULT_LAYOUT: ShowcaseLayout = {
  version: 1,
  canvas: {
    backgroundImageUrl: null,
    backgroundColor: "#09090b",
    backgroundOpacity: 1,
    backgroundBlur: 0,
    aspectRatio: "4 / 5",
  },
  elements: [],
};

function normalizePages(layout: ShowcaseLayout): ShowcasePageType[] {
  if (layout.pages && layout.pages.length > 0) return layout.pages;
  return [{ id: "page-1", elements: layout.elements }];
}

interface ShowcasePageProps {
  build: Build;
  comments: Comment[];
  allBuilds: Build[];
  authorBuilds?: Build[];
  currentUserId?: string;
  isLiked: boolean;
  isBookmarked: boolean;
  likedCommentIds: string[];
  startEditing?: boolean;
  showGuide?: boolean;
  userLevel?: number;
}

export function ShowcasePage({ build, comments, authorBuilds = [], currentUserId, isLiked, isBookmarked, likedCommentIds, startEditing, showGuide, userLevel = 1 }: ShowcasePageProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(!!startEditing);
  const isOwner = currentUserId === build.userId;
  const layout = (build.showcaseLayout as ShowcaseLayout) || DEFAULT_LAYOUT;
  const pages = normalizePages(layout);

  // Editor guide state: show only if server says to AND localStorage hasn't dismissed it
  const [showGuideState, setShowGuideState] = useState(() => {
    if (!showGuide) return false;
    if (typeof window !== "undefined" && localStorage.getItem("gm:editorGuideSeen:v1") === "true") {
      return false;
    }
    return true;
  });

  const handleExit = useCallback(() => {
    setIsEditing(false);
    window.location.reload();
  }, []);

  const handleGuideDismiss = useCallback(() => {
    setShowGuideState(false);
    localStorage.setItem("gm:editorGuideSeen:v1", "true");
    fetch("/api/user/guide-seen", { method: "POST" }).catch(() => {
      // Non-critical; localStorage is the fallback
    });
  }, []);

  if (isEditing && isOwner) {
    return (
      <>
        <div className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <ShowcaseEditor
              build={build}
              initialLayout={layout}
              onExit={handleExit}
              userLevel={userLevel}
            />
          </div>
        </div>
        {showGuideState && <EditorGuideOverlay onDismiss={handleGuideDismiss} />}
      </>
    );
  }

  return (
    <div className="pt-20 pb-16">
      {/* Combined header: Author + Build info */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <div className="flex items-center justify-between gap-4">
          {/* Author info */}
          <div className="flex items-center gap-3 min-w-0">
            <Link href={`/u/${build.userHandle}`} className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-border/50">
              <Image
                src={build.userAvatar}
                alt={build.username}
                fill
                className="object-cover"
                unoptimized
              />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Link href={`/u/${build.userHandle}`} className="text-sm font-medium text-foreground hover:underline truncate">
                  {build.username}
                </Link>
                <VerificationBadge tier={build.verification} size="sm" />
              </div>
              <p className="text-xs text-muted-foreground">Posted {build.createdAt}</p>
            </div>
          </div>

          {/* Build info */}
          <div className="text-right shrink-0">
            <h1 className="text-lg font-bold text-foreground">{build.title}</h1>
            <p className="text-xs text-muted-foreground">{build.grade} &middot; {build.scale}</p>
            {build.kitName && <p className="text-xs text-muted-foreground">{build.kitName}</p>}
          </div>
        </div>

        {/* Techniques tags */}
        {build.techniques.length > 0 && !layout.elements.some((el) => el.type === "metadata") && (
          <div className="mt-2 flex flex-wrap gap-1.5 justify-end">
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

      {/* Canvas pages (stacked vertically) */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {pages.map((page, i) => (
          <div key={page.id} className={cn("relative", i > 0 && "mt-4")}>
            <ShowcaseCanvas layout={{ ...layout, elements: page.elements }} build={build} pageBackground={page.background} />

            {/* Edit button for owner — only on first page */}
            {i === 0 && isOwner && (
              <button
                onClick={() => setIsEditing(true)}
                className="absolute top-4 right-4 z-20 flex items-center gap-2 px-4 py-2 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-white text-sm font-medium hover:bg-black/80 transition-colors"
              >
                <Pencil className="h-4 w-4" />
                Edit Showcase
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Below canvas content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Actions bar */}
        <div className="mt-8">
          <ActionsBar
            buildId={build.id}
            buildSlug={build.slug}
            likeCount={build.likes}
            bookmarkCount={build.bookmarks}
            forkCount={build.forkCount}
            isLiked={isLiked}
            isBookmarked={isBookmarked}
            isOwner={isOwner}
            currentUserId={currentUserId}
          />
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

        {/* More builds by this author */}
        {authorBuilds.length > 0 && (
          <section className="mt-10 relative overflow-hidden rounded-xl border border-border/50 bg-card p-6">
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gx-red/20" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-gx-red/20" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-gx-red/20" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gx-red/20" />

            <div className="text-center mb-6">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gx-red">
                More from {build.username}
              </span>
              <h3 className="mt-1 text-lg font-bold text-foreground">Other Builds</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {authorBuilds.map((b, i) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                >
                  <BuildCard build={b} />
                </motion.div>
              ))}
            </div>

            <div className="mt-4 text-center">
              <Link
                href={`/u/${build.userHandle}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-gx-red transition-colors group"
              >
                View all builds
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
