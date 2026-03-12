"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Pin, Heart, MessageCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { GradeBadge } from "@/components/ui/grade-badge";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { TechniqueChip } from "@/components/ui/technique-chip";
import { BuildGridCard } from "./build-grid-card";
import DomeGallery from "@/components/ui/dome-gallery";
import type { Build, HangarLayout, DomeGallerySettings } from "@/lib/types";

interface BuildGridProps {
  builds: Build[];
  pinnedBuildIds?: string[];
  layout?: HangarLayout;
  accentColor?: string;
  domeSettings?: DomeGallerySettings | null;
}

export function BuildGrid({ builds, pinnedBuildIds = [], layout = "GALLERY", accentColor = "#dc2626", domeSettings }: BuildGridProps) {
  const { t } = useTranslation();

  const sortedBuilds = useMemo(() => {
    if (pinnedBuildIds.length === 0) return builds;
    const pinSet = new Set(pinnedBuildIds);
    // Sort pinned builds first, in pinned order
    const pinned: Build[] = [];
    const rest: Build[] = [];
    for (const id of pinnedBuildIds) {
      const b = builds.find((x) => x.id === id);
      if (b) pinned.push(b);
    }
    for (const b of builds) {
      if (!pinSet.has(b.id)) rest.push(b);
    }
    return [...pinned, ...rest];
  }, [builds, pinnedBuildIds]);

  if (sortedBuilds.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">{t("hangar.emptyHangar")}</p>
      </div>
    );
  }

  if (layout === "DOME_GALLERY") {
    return <DomeGalleryLayout builds={sortedBuilds} accentColor={accentColor} domeSettings={domeSettings} />;
  }

  if (layout === "STORY") {
    return <StoryLayout builds={sortedBuilds} pinnedBuildIds={pinnedBuildIds} accentColor={accentColor} />;
  }

  // Default: GALLERY
  return <GalleryLayout builds={sortedBuilds} pinnedBuildIds={pinnedBuildIds} />;
}

/* ─── GALLERY LAYOUT ─────────────────────────────────────────────── */

function GalleryLayout({ builds, pinnedBuildIds }: { builds: Build[]; pinnedBuildIds: string[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {builds.map((build, i) => (
        <motion.div
          key={build.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: i * 0.04 }}
        >
          <BuildGridCard
            build={build}
            isPinned={pinnedBuildIds.includes(build.id)}
          />
        </motion.div>
      ))}
    </div>
  );
}

/* ─── DOME GALLERY LAYOUT ────────────────────────────────────────── */

const MAX_SPHERE_BUILDS = 12;

function DomeGalleryLayout({ builds, accentColor, domeSettings }: { builds: Build[]; accentColor: string; domeSettings?: DomeGallerySettings | null }) {
  const images = useMemo(() => {
    // If user selected specific builds, use only those (in order)
    const selectedIds = domeSettings?.selectedBuildIds;
    const pool = selectedIds && selectedIds.length > 0
      ? selectedIds
          .map((id) => builds.find((b) => b.id === id))
          .filter(Boolean) as Build[]
      : builds;

    // Cap at max
    return pool
      .slice(0, MAX_SPHERE_BUILDS)
      .map((build) => {
        const primary = build.images.find((img) => img.isPrimary) || build.images[0];
        if (!primary) return null;
        return { src: primary.url, alt: build.title, href: `/builds/${build.slug}` };
      })
      .filter(Boolean) as { src: string; alt: string; href: string }[];
  }, [builds, domeSettings?.selectedBuildIds]);

  if (images.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Upload some builds to see them in the Dome Gallery</p>
      </div>
    );
  }

  const grayscale = domeSettings?.grayscale ?? false;
  const autoRotateSpeed = domeSettings?.autoSpin ? (domeSettings.spinSpeed ?? 1) : 0;

  return (
    <div className="relative w-full" style={{ height: "min(65vh, 550px)" }}>
      <DomeGallery
        images={images}
        overlayBlurColor="var(--background, #060010)"
        grayscale={grayscale}
        minRadius={180}
        fit={0.35}
        imageBorderRadius="12px"
        openedImageBorderRadius="16px"
        dragDampening={2}
        autoRotateSpeed={autoRotateSpeed}
      />
    </div>
  );
}

/* ─── STORY LAYOUT ───────────────────────────────────────────────── */

function StoryLayout({ builds, pinnedBuildIds, accentColor }: { builds: Build[]; pinnedBuildIds: string[]; accentColor: string }) {
  return (
    <div className="relative">
      {/* Vertical timeline line */}
      <div
        className="absolute left-4 sm:left-8 top-0 bottom-0 w-px"
        style={{ backgroundColor: `${accentColor}30` }}
      />

      <div className="space-y-8">
        {builds.map((build, i) => {
          const primaryImage = build.images.find((img) => img.isPrimary) || build.images[0];
          const isPinned = pinnedBuildIds.includes(build.id);
          const isEven = i % 2 === 0;

          return (
            <motion.div
              key={build.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
              className="relative pl-10 sm:pl-20"
            >
              {/* Timeline dot */}
              <div
                className="absolute left-4 sm:left-8 top-6 w-2.5 h-2.5 rounded-full -translate-x-1/2 ring-2 ring-background z-10"
                style={{ backgroundColor: isPinned ? accentColor : "#52525b" }}
              />

              <Link href={`/builds/${build.slug}`}>
                <div className="group rounded-xl border border-border/30 bg-card/80 backdrop-blur-sm overflow-hidden hover:border-border/60 transition-all duration-300 hover:shadow-lg">
                  {/* Large image */}
                  {primaryImage && (
                    <div className="relative aspect-[21/9] overflow-hidden">
                      <Image
                        src={primaryImage.url}
                        alt={primaryImage.alt || build.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        style={primaryImage.objectPosition ? { objectPosition: primaryImage.objectPosition } : undefined}
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* Overlaid info */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <GradeBadge grade={build.grade} />
                          <span className="text-[10px] font-mono text-zinc-300">{build.scale}</span>
                          {isPinned && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium text-white backdrop-blur-sm" style={{ backgroundColor: `${accentColor}cc` }}>
                              <Pin className="h-2.5 w-2.5" />
                              Pinned
                            </span>
                          )}
                          {build.verification !== "unverified" && (
                            <VerificationBadge tier={build.verification} size="sm" />
                          )}
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
                          {build.title}
                        </h3>
                        <p className="text-sm text-zinc-300 mt-0.5">{build.kitName}</p>
                      </div>
                    </div>
                  )}

                  {/* Bottom section */}
                  <div className="p-4 flex items-center justify-between">
                    {/* Techniques */}
                    <div className="flex flex-wrap gap-1">
                      {build.techniques.slice(0, 4).map((tech) => (
                        <TechniqueChip key={tech} technique={tech} size="sm" />
                      ))}
                      {build.techniques.length > 4 && (
                        <span className="text-[10px] text-muted-foreground self-center">+{build.techniques.length - 4}</span>
                      )}
                    </div>
                    {/* Stats */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{build.likes}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{build.comments}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
