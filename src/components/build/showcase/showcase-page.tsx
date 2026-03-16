"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { SmartImage as Image } from "@/components/ui/smart-image";
import Link from "next/link";
import { Pencil, ArrowRight, Package, Palette, Layers, Clock, Wrench, X, Check, Crosshair, Move } from "lucide-react";
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
import { updateBuildInfo, updateImagePosition } from "@/lib/actions/build";
import { toast } from "sonner";
import type { Build, BuildImage, Comment, ShowcaseLayout, ShowcaseImageElement, ShowcasePage as ShowcasePageType, Grade, Scale, BuildStatus, Technique } from "@/lib/types";

const ALL_GRADES: Grade[] = ["HG", "RG", "MG", "PG", "SD", "RE/100", "FM", "EG", "MGEX", "HiRM"];
const ALL_SCALES: Scale[] = ["1/144", "1/100", "1/60", "Non-scale"];
const ALL_STATUSES: BuildStatus[] = ["WIP", "Completed", "Abandoned"];
const ALL_TECHNIQUES: Technique[] = [
  "Straight Build", "Panel Lining", "Painting", "Airbrushing", "Hand Painting",
  "Weathering", "Scribing", "Pla-plating", "Kitbashing", "Scratch Building",
  "LED/Electronics", "Custom Decals", "Topcoat", "Candy Coat", "Metallic Finish", "Battle Damage",
];

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

function computeGridPositions(count: number): { x: number; y: number; w: number; h: number }[] {
  // Predefined layouts for 1-4 images
  const presets = [
    [{ x: 5, y: 5, w: 90, h: 90 }],
    [{ x: 2, y: 10, w: 47, h: 80 }, { x: 51, y: 10, w: 47, h: 80 }],
    [{ x: 2, y: 5, w: 55, h: 90 }, { x: 59, y: 5, w: 39, h: 44 }, { x: 59, y: 51, w: 39, h: 44 }],
    [{ x: 2, y: 2, w: 47, h: 47 }, { x: 51, y: 2, w: 47, h: 47 }, { x: 2, y: 51, w: 47, h: 47 }, { x: 51, y: 51, w: 47, h: 47 }],
  ];

  if (count <= 4) return presets[count - 1] || presets[0];

  // Dynamic grid for 5+ images
  const cols = count <= 6 ? 2 : count <= 9 ? 3 : Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const gap = 2;
  const cellW = (100 - gap * (cols + 1)) / cols;
  const cellH = (100 - gap * (rows + 1)) / rows;
  return Array.from({ length: count }, (_, i) => ({
    x: gap + (i % cols) * (cellW + gap),
    y: gap + Math.floor(i / cols) * (cellH + gap),
    w: cellW,
    h: cellH,
  }));
}

function generateInitialLayout(images: BuildImage[]): ShowcaseLayout {
  const count = Math.min(images.length, 25);
  const elements: ShowcaseImageElement[] = [];
  const grid = computeGridPositions(count);

  for (let i = 0; i < count; i++) {
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

// ─── Page Viewer (horizontal swipe navigation) ─────────────────

function PageViewer({
  pages,
  layout,
  build,
  isOwner,
  onEdit,
}: {
  pages: ShowcasePageType[];
  layout: ShowcaseLayout;
  build: Build;
  isOwner: boolean;
  onEdit: () => void;
}) {
  const [currentPage, setCurrentPage] = useState(0);
  const [animating, setAnimating] = useState(false);
  const touchRef = useRef<{ x: number; time: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Prevent browser back navigation on horizontal swipe
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
      }
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  const goTo = (index: number) => {
    const target = Math.max(0, Math.min(pages.length - 1, index));
    if (target === currentPage) return;
    setAnimating(true);
    setCurrentPage(target);
    setTimeout(() => setAnimating(false), 350);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchRef.current = { x: e.touches[0].clientX, time: Date.now() };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const elapsed = Date.now() - touchRef.current.time;
    touchRef.current = null;
    if (elapsed > 500 || Math.abs(dx) < 50) return;
    if (dx < 0) goTo(currentPage + 1);
    else goTo(currentPage - 1);
  };

  return (
    <div
      ref={containerRef}
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 select-none overflow-hidden"
      style={{ overscrollBehaviorX: "contain" }}
      onContextMenu={(e) => e.preventDefault()}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative">
        {/* Render all pages side-by-side, slide via translateX — no unmount = no black flash */}
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentPage * 100}%)` }}
        >
          {pages.map((page, i) => (
            <div key={page.id} className="w-full flex-shrink-0">
              <ShowcaseCanvas
                layout={{ ...layout, elements: page.elements }}
                build={build}
                pageBackground={page.background}
              />
            </div>
          ))}
        </div>

        {/* Edit button for owner */}
        {isOwner && (
          <button
            onClick={onEdit}
            className="absolute top-4 right-4 z-20 flex items-center gap-2 px-4 py-2 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-white text-sm font-medium hover:bg-black/80 transition-colors"
          >
            <Pencil className="h-4 w-4" />
            Edit Showcase
          </button>
        )}
      </div>

      {/* Page indicator + navigation */}
      {pages.length > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage === 0}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>

          {/* Dot indicators */}
          <div className="flex items-center gap-1.5">
            {pages.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={cn(
                  "rounded-full transition-all",
                  i === currentPage
                    ? "w-6 h-2 bg-gx-red"
                    : "w-2 h-2 bg-zinc-600 hover:bg-zinc-400"
                )}
                aria-label={`Page ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => goTo(currentPage + 1)}
            disabled={currentPage === pages.length - 1}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>

          <span className="text-xs text-muted-foreground ml-2">
            {currentPage + 1} / {pages.length}
          </span>
        </div>
      )}
    </div>
  );
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
    // Strip ?edit=1 from URL so reload doesn't re-enter editor
    const url = new URL(window.location.href);
    url.searchParams.delete("edit");
    window.location.replace(url.toString());
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
        <div className="pt-4 pb-32 px-4 sm:px-6 lg:px-8" style={{ overscrollBehaviorX: "none" }}>
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

      {/* Canvas pages (horizontal swipe navigation) */}
      <PageViewer pages={pages} layout={layout} build={build} isOwner={isOwner} onEdit={() => setIsEditing(true)} />

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
                  className="h-full"
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

  // All editable fields
  const [title, setTitle] = useState(build.title);
  const [kitName, setKitName] = useState(build.kitName);
  const [grade, setGrade] = useState<string>(build.grade);
  const [scale, setScale] = useState<string>(build.scale);
  const [status, setStatus] = useState<string>(build.status);
  const [techniques, setTechniques] = useState<string[]>(build.techniques);
  const [toolsStr, setToolsStr] = useState(build.tools?.join(", ") || "");
  const [description, setDescription] = useState(build.description || "");
  const [intentStatement, setIntentStatement] = useState(build.intentStatement || "");
  const [paintSystem, setPaintSystem] = useState(build.paintSystem || "");
  const [topcoat, setTopcoat] = useState(build.topcoat || "");
  const [timeInvested, setTimeInvested] = useState(build.timeInvested || "");

  // Image focal point state
  const primaryImage = build.images.find((img) => img.isPrimary) || build.images[0];
  const [focalPoint, setFocalPoint] = useState(primaryImage?.objectPosition || "50% 50%");
  const [isSavingFocal, setIsSavingFocal] = useState(false);

  const metaRows = [
    { icon: Package, label: "Kit", value: build.kitName },
    { icon: Palette, label: "Paint System", value: isEditing ? undefined : (build.paintSystem || paintSystem) },
    { icon: Layers, label: "Topcoat", value: isEditing ? undefined : (build.topcoat || topcoat) },
    { icon: Clock, label: "Time Invested", value: isEditing ? undefined : (build.timeInvested || timeInvested) },
    { icon: Wrench, label: "Tools", value: isEditing ? undefined : build.tools?.join(", ") },
  ].filter((row) => row.value);

  const displayDescription = isEditing ? undefined : (build.description || description);
  const displayIntent = isEditing ? undefined : (build.intentStatement || intentStatement);

  const hasInfo = displayDescription || displayIntent || metaRows.length > 0 || build.techniques.length > 0 || isOwner;

  function toggleTechnique(tech: string) {
    setTechniques((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    );
  }

  async function handleSave() {
    if (!title.trim()) { toast.error("Title is required."); return; }
    if (!kitName.trim()) { toast.error("Kit name is required."); return; }

    setIsSaving(true);
    const toolsArray = toolsStr.split(",").map((t) => t.trim()).filter(Boolean);
    const result = await updateBuildInfo({
      buildId: build.id,
      title: title.trim(),
      kitName: kitName.trim(),
      grade,
      scale,
      status,
      techniques,
      tools: toolsArray,
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
      // Update build object in-place for immediate UI feedback
      build.title = title.trim();
      build.kitName = kitName.trim();
      build.grade = grade as Build["grade"];
      build.scale = scale as Build["scale"];
      build.status = status as Build["status"];
      build.techniques = techniques as Build["techniques"];
      build.tools = toolsArray;
      build.description = description || undefined;
      build.intentStatement = intentStatement || undefined;
      build.paintSystem = paintSystem || undefined;
      build.topcoat = topcoat || undefined;
      build.timeInvested = timeInvested || undefined;
      // If slug changed, redirect
      if ("newSlug" in result && result.newSlug) {
        window.location.replace(`/builds/${result.newSlug}`);
      }
    }
  }

  function handleCancel() {
    setTitle(build.title);
    setKitName(build.kitName);
    setGrade(build.grade);
    setScale(build.scale);
    setStatus(build.status);
    setTechniques([...build.techniques]);
    setToolsStr(build.tools?.join(", ") || "");
    setDescription(build.description || "");
    setIntentStatement(build.intentStatement || "");
    setPaintSystem(build.paintSystem || "");
    setTopcoat(build.topcoat || "");
    setTimeInvested(build.timeInvested || "");
    setIsEditing(false);
  }

  async function handleFocalPointClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    const pos = `${x}% ${y}%`;
    setFocalPoint(pos);

    if (!primaryImage?.id) return;
    setIsSavingFocal(true);
    const result = await updateImagePosition({
      buildId: build.id,
      imageId: primaryImage.id,
      objectPosition: pos,
    });
    setIsSavingFocal(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Image position saved!");
      if (primaryImage) primaryImage.objectPosition = pos;
    }
  }

  if (!hasInfo) return null;

  const inputClass = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gx-red/50";
  const labelClass = "text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 block";
  const selectClass = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gx-red/50";

  return (
    <section className="mt-8 rounded-xl border border-border/50 bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-lg font-bold text-foreground">Build Details</h2>
          {!isEditing && (
            <>
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
            </>
          )}
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
        {/* Title & Kit Name */}
        {isEditing && (
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Build Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="Build title" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Kit Name</label>
              <input value={kitName} onChange={(e) => setKitName(e.target.value)} maxLength={200} placeholder="Kit name" className={inputClass} />
            </div>
          </div>
        )}

        {/* Grade, Scale, Status */}
        {isEditing && (
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Grade</label>
              <select value={grade} onChange={(e) => setGrade(e.target.value)} className={selectClass}>
                {ALL_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Scale</label>
              <select value={scale} onChange={(e) => setScale(e.target.value)} className={selectClass}>
                {ALL_SCALES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
                {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Techniques (toggle chips in edit mode, read-only chips otherwise) */}
        {isEditing ? (
          <div>
            <label className={labelClass}>Techniques</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_TECHNIQUES.map((tech) => {
                const active = techniques.includes(tech);
                return (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => toggleTechnique(tech)}
                    className={cn(
                      "px-2.5 py-1 text-xs font-medium rounded-full border transition-colors",
                      active
                        ? "bg-gx-red/20 text-gx-red border-gx-red/40"
                        : "bg-muted/30 text-muted-foreground border-border/50 hover:border-border"
                    )}
                  >
                    {tech}
                  </button>
                );
              })}
            </div>
          </div>
        ) : build.techniques.length > 0 ? (
          <div>
            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Techniques</h3>
            <div className="flex flex-wrap gap-1.5">
              {build.techniques.map((tech) => (
                <TechniqueChip key={tech} technique={tech} size="md" />
              ))}
            </div>
          </div>
        ) : null}

        {/* Description */}
        {isEditing ? (
          <div>
            <label className={labelClass}>About This Build</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={5000}
              placeholder="Describe your build — the story behind it, what makes it special..."
              className={cn(inputClass, "resize-y")}
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
            <label className={labelClass}>Builder&apos;s Quote</label>
            <textarea
              value={intentStatement}
              onChange={(e) => setIntentStatement(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="A short quote about your intent or philosophy behind this build..."
              className={cn(inputClass, "resize-y italic")}
            />
          </div>
        ) : displayIntent ? (
          <blockquote className="border-l-2 border-gx-red pl-4 py-2">
            <p className="text-sm text-zinc-300 italic leading-relaxed">
              &ldquo;{displayIntent}&rdquo;
            </p>
          </blockquote>
        ) : null}

        {/* Paint, Topcoat, Time, Tools */}
        {isEditing && (
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Paint System</label>
              <input value={paintSystem} onChange={(e) => setPaintSystem(e.target.value)} placeholder="e.g. Lacquer, Acrylic, Enamel" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Topcoat</label>
              <input value={topcoat} onChange={(e) => setTopcoat(e.target.value)} placeholder="e.g. Matte, Gloss, Semi-gloss" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Time Invested</label>
              <input value={timeInvested} onChange={(e) => setTimeInvested(e.target.value)} placeholder="e.g. 40 hours, 2 weeks" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Tools (comma-separated)</label>
              <input value={toolsStr} onChange={(e) => setToolsStr(e.target.value)} placeholder="e.g. Airbrush, Panel liner, Nippers" className={inputClass} />
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

        {/* Image Focal Point (edit mode only) */}
        {isEditing && primaryImage && (
          <div>
            <label className={labelClass}>
              <Move className="h-3 w-3 inline mr-1" />
              Cover Image Focal Point
            </label>
            <p className="text-[10px] text-muted-foreground mb-2">Click on the image to set where it should be centered when cropped on cards.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Focal point editor */}
              <div className="relative w-full sm:w-2/3 max-w-sm aspect-[4/3] rounded-lg overflow-hidden border border-border/50 cursor-crosshair group shrink-0" onClick={handleFocalPointClick}>
                <Image
                  src={primaryImage.url}
                  alt={primaryImage.alt}
                  fill
                  className="object-cover"
                  style={{ objectPosition: focalPoint }}
                />
                {/* Focal point marker */}
                <div
                  className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ left: focalPoint.split(" ")[0], top: focalPoint.split(" ")[1] }}
                >
                  <Crosshair className="w-6 h-6 text-white drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]" />
                </div>
                {isSavingFocal && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="text-white text-xs">Saving...</span>
                  </div>
                )}
              </div>
              {/* Live card thumbnail preview */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Card Preview</span>
                <div className="w-40 rounded-lg border border-border/50 bg-card overflow-hidden shadow-sm">
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    <Image
                      src={primaryImage.url}
                      alt={primaryImage.alt}
                      fill
                      sizes="160px"
                      className="object-cover"
                      style={{ objectPosition: focalPoint }}
                    />
                  </div>
                  <div className="px-2 py-1.5">
                    <p className="text-[10px] font-semibold text-foreground truncate">{build.title}</p>
                    <p className="text-[9px] text-muted-foreground truncate">{build.kitName}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
