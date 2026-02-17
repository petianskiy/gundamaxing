"use client";

import { useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Bookmark,
  GitFork,
  Share2,
  X,
  Package,
  Palette,
  Layers,
  Clock,
  Wrench,
  Calendar,
  ChevronRight,
  MessageCircle,
  ThumbsUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import { mockBuilds, mockComments } from "@/lib/mock/data";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { TechniqueChip } from "@/components/ui/technique-chip";
import { GradeBadge } from "@/components/ui/grade-badge";
import type { Build, Comment } from "@/lib/types";

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

export default function BuildPassportPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useTranslation();
  const { id } = use(params);
  const build = mockBuilds.find((b) => b.id === id);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);

  if (!build) {
    return (
      <div className="pt-24 pb-16 px-4 text-center">
        <h1 className="text-2xl font-bold text-foreground">{t("builds.notFound")}</h1>
        <p className="mt-2 text-muted-foreground">{t("builds.notFoundDesc")}</p>
        <Link href="/builds" className="mt-4 inline-block text-sm text-gx-red hover:text-red-400">
          {t("shared.backToBuilds")}
        </Link>
      </div>
    );
  }

  const currentImage = build.images[selectedImageIndex];

  const metaRows = [
    { icon: Package, label: t("builds.kit"), value: build.kitName },
    { icon: Palette, label: t("builds.paintSystem"), value: build.paintSystem },
    { icon: Layers, label: t("builds.topcoat"), value: build.topcoat },
    { icon: Clock, label: t("builds.timeInvested"), value: build.timeInvested },
    { icon: Wrench, label: t("builds.tools"), value: build.tools?.join(", ") },
  ].filter((row) => row.value);

  return (
    <div className="pt-20 pb-16">
      {/* Showcase Viewer */}
      <section className="bg-black">
        <div className="mx-auto max-w-5xl px-4 py-6">
          {/* Main image */}
          <div
            className="relative aspect-[16/10] rounded-lg overflow-hidden cursor-zoom-in group"
            onClick={() => setLightboxOpen(true)}
          >
            <Image
              src={currentImage.url}
              alt={currentImage.alt}
              fill
              className="object-cover object-top"
              style={currentImage.objectPosition ? { objectPosition: currentImage.objectPosition } : undefined}
              unoptimized
              priority
            />

            {/* Callout pins */}
            {build.calloutPins?.map((pin) => (
              <div
                key={pin.id}
                className="absolute z-10"
                style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: "translate(-50%, -50%)" }}
                onMouseEnter={() => setHoveredPin(pin.id)}
                onMouseLeave={() => setHoveredPin(null)}
              >
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gx-red/60" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-gx-red border-2 border-white/80" />
                </span>
                {/* Tooltip */}
                <AnimatePresence>
                  {hoveredPin === pin.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute left-6 top-0 z-20 w-48 p-2.5 rounded-lg bg-black/90 backdrop-blur-sm border border-white/10"
                    >
                      <p className="text-xs font-semibold text-white">{pin.label}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{pin.description}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Thumbnails */}
          {build.images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
              {build.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImageIndex(i)}
                  className={cn(
                    "relative w-20 h-14 rounded-md overflow-hidden flex-shrink-0 border-2 transition-colors",
                    i === selectedImageIndex ? "border-gx-red" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <Image src={img.url} alt={img.alt} fill className="object-cover" unoptimized />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
            <Image
              src={currentImage.url}
              alt={currentImage.alt}
              width={1200}
              height={900}
              className="max-h-[90vh] w-auto object-contain rounded-lg"
              unoptimized
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 mt-8">
        {/* Actions bar */}
        <div className="flex items-center gap-2 mb-8 p-3 rounded-xl border border-border/50 bg-card">
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

        {/* Build Passport Card */}
        <section className="rounded-xl border border-border/50 bg-card p-6 sm:p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                {build.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <GradeBadge grade={build.grade} />
                <span className="text-xs text-muted-foreground">{build.timeline}</span>
                <span className="text-xs text-muted-foreground">&middot;</span>
                <span className="text-xs text-muted-foreground">{build.scale}</span>
                <span className="text-xs text-muted-foreground">&middot;</span>
                <span className={cn(
                  "text-xs font-medium",
                  build.status === "WIP" ? "text-amber-400" : build.status === "Completed" ? "text-green-400" : "text-zinc-500"
                )}>
                  {build.status}
                </span>
                <VerificationBadge tier={build.verification} showLabel size="md" />
              </div>
            </div>
          </div>

          {/* Metadata grid */}
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 mb-6">
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

          {/* Techniques */}
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">{t("builds.techniques")}</h3>
            <div className="flex flex-wrap gap-1.5">
              {build.techniques.map((tech) => (
                <TechniqueChip key={tech} technique={tech} size="md" />
              ))}
            </div>
          </div>

          {/* Intent Statement */}
          {build.intentStatement && (
            <blockquote className="border-l-2 border-gx-red pl-4 py-2 my-6">
              <p className="text-sm text-zinc-300 italic leading-relaxed">
                &ldquo;{build.intentStatement}&rdquo;
              </p>
            </blockquote>
          )}

          {/* Builder */}
          <div className="flex items-center gap-3 pt-4 border-t border-border/50">
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
              <p className="text-xs text-muted-foreground">{t("shared.posted")} {build.createdAt}</p>
            </div>
            <VerificationBadge tier={build.verification} showLabel size="sm" />
          </div>
        </section>

        {/* Build Log */}
        {build.buildLog && build.buildLog.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-bold text-foreground mb-6">{t("builds.buildLog")}</h2>
            <div className="relative pl-8 border-l-2 border-border/50 space-y-8">
              {build.buildLog.map((entry) => (
                <div key={entry.id} className="relative">
                  {/* Dot */}
                  <div className="absolute -left-[calc(2rem+5px)] top-1 w-2.5 h-2.5 rounded-full bg-gx-red border-2 border-background" />
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-mono">{entry.date}</span>
                  </div>
                  <h3 className="font-semibold text-foreground">{entry.title}</h3>
                  <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{entry.content}</p>
                  {entry.images.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {entry.images.map((img, i) => (
                        <div key={i} className="relative w-24 h-16 rounded-md overflow-hidden">
                          <Image src={img} alt="" fill className="object-cover" unoptimized />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Build DNA */}
        <section className="mt-10 rounded-xl border border-border/50 bg-card p-6">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <GitFork className="h-5 w-5 text-gx-red" />
            {t("builds.buildDna")}
          </h2>
          <div className="space-y-4">
            {build.baseKit && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">{t("builds.baseKit")}</p>
                <p className="text-sm text-foreground">{build.baseKit}</p>
              </div>
            )}
            {build.inspiredBy && build.inspiredBy.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">{t("builds.inspiredBy")}</p>
                <div className="flex flex-wrap gap-2">
                  {build.inspiredBy.map((refId) => {
                    const inspired = mockBuilds.find((b) => b.id === refId);
                    return (
                      <Link
                        key={refId}
                        href={`/builds/${refId}`}
                        className="inline-flex items-center gap-1 text-sm text-gx-blue hover:underline"
                      >
                        <ChevronRight className="h-3 w-3" />
                        {inspired?.title || refId}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
            {build.forks && build.forks.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">{t("builds.forks")} ({build.forks.length})</p>
                <div className="flex flex-wrap gap-2">
                  {build.forks.map((forkId) => {
                    const forked = mockBuilds.find((b) => b.id === forkId);
                    return (
                      <Link
                        key={forkId}
                        href={`/builds/${forkId}`}
                        className="inline-flex items-center gap-1 text-sm text-gx-blue hover:underline"
                      >
                        <GitFork className="h-3 w-3" />
                        {forked?.title || forkId}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Comments */}
        <section className="mt-10">
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
            {mockComments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
