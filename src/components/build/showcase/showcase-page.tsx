"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pencil, ArrowRight, Package, Palette, Layers, Clock, Wrench, X, Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { GradeBadge } from "@/components/ui/grade-badge";
import { TechniqueChip } from "@/components/ui/technique-chip";
import { BuildCard } from "@/components/build/build-card";
import { ShowcaseCanvas } from "./showcase-canvas";
import { ShowcaseEditor } from "./showcase-editor";
import { EditorGuideOverlay } from "./editor-guide-overlay";
import { ActionsBar } from "@/components/build/actions-bar";
import { CommentSection } from "@/components/build/comment-section";
import { updateBuildInfo } from "@/lib/actions/build";
import { toast } from "sonner";
import type { Build, BuildImage, Comment, ShowcaseLayout, ShowcaseImageElement, ShowcasePage as ShowcasePageType } from "@/lib/types";

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

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function generateInitialLayout(images: BuildImage[]): ShowcaseLayout {
  const maxAutoLoad = Math.min(images.length, 4);
  const elements: ShowcaseImageElement[] = [];

  const positions = [
    [{ x: 5, y: 5, w: 90, h: 90 }],
    [{ x: 2, y: 10, w: 47, h: 80 }, { x: 51, y: 10, w: 47, h: 80 }],
    [{ x: 2, y: 5, w: 55, h: 90 }, { x: 59, y: 5, w: 39, h: 44 }, { x: 59, y: 51, w: 39, h: 44 }],
    [{ x: 2, y: 2, w: 47, h: 47 }, { x: 51, y: 2, w: 47, h: 47 }, { x: 2, y: 51, w: 47, h: 47 }, { x: 51, y: 51, w: 47, h: 47 }],
  ];

  const grid = positions[maxAutoLoad - 1] || positions[0];

  for (let i = 0; i < maxAutoLoad; i++) {
    const img = images[i];
    const pos = grid[i];
    elements.push({
      id: generateId(),
      type: "image",
      x: pos.x,
      y: pos.y,
      width: pos.w,
      height: pos.h,
      zIndex: i + 1,
      rotation: 0,
      imageId: img.id || generateId(),
      imageUrl: img.url,
      objectFit: "cover",
      borderRadius: 8,
      shadow: true,
      caption: null,
    });
  }

  return { ...DEFAULT_LAYOUT, elements };
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
  const hasExistingLayout = !!build.showcaseLayout;
  const layout = hasExistingLayout
    ? (build.showcaseLayout as ShowcaseLayout)
    : build.images.length > 0
      ? generateInitialLayout(build.images)
      : DEFAULT_LAYOUT;
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
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-5">
        {/* Title — always truly centered */}
        <div className="text-center mb-3">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{build.title}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {build.grade} &middot; {build.scale}
            {build.kitName && <> &middot; {build.kitName}</>}
          </p>
        </div>

        {/* Author row + techniques */}
        <div className="flex items-center justify-between gap-4">
          <Link href={`/u/${build.userHandle}`} className="flex items-center gap-2.5 min-w-0 group">
            <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-border/50">
              <Image
                src={build.userAvatar}
                alt={build.username}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors truncate">
              {build.username}
            </span>
            <VerificationBadge tier={build.verification} size="sm" />
            <span className="text-xs text-muted-foreground/60 hidden sm:inline">&middot; {build.createdAt}</span>
          </Link>

          {/* Techniques tags */}
          {build.techniques.length > 0 && !layout.elements.some((el) => el.type === "metadata") && (
            <div className="flex flex-wrap gap-1.5 justify-end shrink-0">
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
      </div>

      {/* Canvas pages (stacked vertically) */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 select-none" onContextMenu={(e) => e.preventDefault()}>
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

        {/* Build Info Section */}
        <BuildInfoSection build={build} isOwner={isOwner} />

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

/* ─── Build Info Section (below canvas) ──────────────────────────── */

function BuildInfoSection({ build, isOwner }: { build: Build; isOwner: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [description, setDescription] = useState(build.description || "");
  const [intentStatement, setIntentStatement] = useState(build.intentStatement || "");
  const [paintSystem, setPaintSystem] = useState(build.paintSystem || "");
  const [topcoat, setTopcoat] = useState(build.topcoat || "");
  const [timeInvested, setTimeInvested] = useState(build.timeInvested || "");

  const metaRows = [
    { icon: Package, label: "Kit", value: build.kitName },
    { icon: Palette, label: "Paint System", value: isEditing ? undefined : (build.paintSystem || paintSystem) },
    { icon: Layers, label: "Topcoat", value: isEditing ? undefined : (build.topcoat || topcoat) },
    { icon: Clock, label: "Time Invested", value: isEditing ? undefined : (build.timeInvested || timeInvested) },
    { icon: Wrench, label: "Tools", value: build.tools?.join(", ") },
  ].filter((row) => row.value);

  const displayDescription = isEditing ? undefined : (build.description || description);
  const displayIntent = isEditing ? undefined : (build.intentStatement || intentStatement);

  const hasInfo = displayDescription || displayIntent || metaRows.length > 0 || build.techniques.length > 0 || isOwner;

  async function handleSave() {
    setIsSaving(true);
    const result = await updateBuildInfo({
      buildId: build.id,
      description: description || undefined,
      intentStatement: intentStatement || undefined,
      paintSystem: paintSystem || undefined,
      topcoat: topcoat || undefined,
      timeInvested: timeInvested || undefined,
    });
    setIsSaving(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Build info updated!");
      setIsEditing(false);
      // Update the build object in-place for immediate UI feedback
      build.description = description || undefined;
      build.intentStatement = intentStatement || undefined;
      build.paintSystem = paintSystem || undefined;
      build.topcoat = topcoat || undefined;
      build.timeInvested = timeInvested || undefined;
    }
  }

  function handleCancel() {
    setDescription(build.description || "");
    setIntentStatement(build.intentStatement || "");
    setPaintSystem(build.paintSystem || "");
    setTopcoat(build.topcoat || "");
    setTimeInvested(build.timeInvested || "");
    setIsEditing(false);
  }

  if (!hasInfo) return null;

  return (
    <section className="mt-8 rounded-xl border border-border/50 bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-foreground">Build Details</h2>
          <GradeBadge grade={build.grade} />
          <span className="text-xs font-mono text-muted-foreground">{build.scale}</span>
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded",
            build.status === "WIP"
              ? "bg-amber-500/10 text-amber-400"
              : build.status === "Completed"
                ? "bg-green-500/10 text-green-400"
                : "bg-zinc-500/10 text-zinc-400"
          )}>
            {build.status}
          </span>
        </div>
        {isOwner && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Pencil className="h-3 w-3" />
            Edit Info
          </button>
        )}
        {isOwner && isEditing && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted/50"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="text-xs text-white bg-gx-red hover:bg-gx-red/90 transition-colors flex items-center gap-1 px-3 py-1 rounded-md disabled:opacity-50"
            >
              <Check className="h-3 w-3" />
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>

      <div className="px-6 pb-6 space-y-5">
        {/* Description */}
        {isEditing ? (
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 block">About This Build</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={5000}
              placeholder="Describe your build — the story behind it, what makes it special..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gx-red/50 resize-y"
            />
            <p className="text-[10px] text-muted-foreground/50 text-right mt-0.5">{description.length}/5000</p>
          </div>
        ) : displayDescription ? (
          <div>
            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">About This Build</h3>
            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{displayDescription}</p>
          </div>
        ) : null}

        {/* Intent Statement */}
        {isEditing ? (
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 block">Builder&apos;s Quote</label>
            <textarea
              value={intentStatement}
              onChange={(e) => setIntentStatement(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="A short quote about your intent or philosophy behind this build..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground italic placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gx-red/50 resize-y"
            />
          </div>
        ) : displayIntent ? (
          <blockquote className="border-l-2 border-gx-red pl-4 py-2">
            <p className="text-sm text-zinc-300 italic leading-relaxed">
              &ldquo;{displayIntent}&rdquo;
            </p>
          </blockquote>
        ) : null}

        {/* Editable paint/topcoat/time fields */}
        {isEditing && (
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 block">Paint System</label>
              <input
                value={paintSystem}
                onChange={(e) => setPaintSystem(e.target.value)}
                placeholder="e.g. Lacquer, Acrylic, Enamel"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gx-red/50"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 block">Topcoat</label>
              <input
                value={topcoat}
                onChange={(e) => setTopcoat(e.target.value)}
                placeholder="e.g. Matte, Gloss, Semi-gloss"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gx-red/50"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 block">Time Invested</label>
              <input
                value={timeInvested}
                onChange={(e) => setTimeInvested(e.target.value)}
                placeholder="e.g. 40 hours, 2 weeks"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gx-red/50"
              />
            </div>
          </div>
        )}

        {/* Metadata grid (read-only view) */}
        {!isEditing && metaRows.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2.5">
            {metaRows.map((row) => (
              <div key={row.label} className="flex items-start gap-3 py-2 border-b border-border/30">
                <row.icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{row.label}</p>
                  <p className="text-sm text-foreground mt-0.5">{row.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Techniques */}
        {build.techniques.length > 0 && (
          <div>
            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Techniques</h3>
            <div className="flex flex-wrap gap-1.5">
              {build.techniques.map((tech) => (
                <TechniqueChip key={tech} technique={tech} size="md" />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
