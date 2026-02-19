"use client";

import { useEffect, useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { GradeBadge } from "@/components/ui/grade-badge";
import { TechniqueChip } from "@/components/ui/technique-chip";
import type { Build } from "@/lib/types";
import { InspectionHotspots } from "./inspection-hotspots";
import { ReactionBar } from "./reaction-bar";
import { BuildDnaPanel } from "./build-dna-panel";
import { BuildTimeline } from "./build-timeline";

interface InspectionOverlayProps {
  build: Build;
  currentUserId?: string;
  onClose: () => void;
}

export function InspectionOverlay({
  build,
  currentUserId,
  onClose,
}: InspectionOverlayProps) {
  const { t } = useTranslation();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [handleEscape]);

  const selectedImage = build.images[selectedImageIndex];

  const metadataItems = [
    { label: t("hangar.inspect.paintSystem"), value: build.paintSystem },
    { label: t("hangar.inspect.topcoat"), value: build.topcoat },
    { label: t("hangar.inspect.timeInvested"), value: build.timeInvested },
    {
      label: t("hangar.inspect.tools"),
      value: build.tools?.join(", "),
    },
  ].filter((item) => item.value);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className={cn(
          "fixed top-4 right-4 z-[60]",
          "w-10 h-10 rounded-full flex items-center justify-center",
          "bg-zinc-900/80 border border-[#27272a]",
          "text-zinc-400 hover:text-white hover:border-zinc-600",
          "transition-colors"
        )}
        aria-label={t("hangar.inspect.close")}
      >
        <X className="w-5 h-5" />
      </button>

      {/* Scrollable content */}
      <div className="absolute inset-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          {/* Primary image with hotspots */}
          <motion.div
            layoutId={`build-${build.id}`}
            className="relative w-full rounded-xl overflow-hidden bg-[#18181b] border border-[#27272a]"
            style={{ maxHeight: "70vh" }}
          >
            {selectedImage ? (
              <div className="relative w-full" style={{ maxHeight: "70vh" }}>
                <Image
                  src={selectedImage.url}
                  alt={selectedImage.alt || build.title}
                  width={1200}
                  height={750}
                  unoptimized
                  className="w-full h-auto object-contain max-h-[70vh]"
                  style={{ objectPosition: selectedImage.objectPosition }}
                />

                {/* Callout pins on the image */}
                {build.calloutPins && build.calloutPins.length > 0 && (
                  <InspectionHotspots
                    pins={build.calloutPins}
                    imageWidth={1200}
                    imageHeight={750}
                  />
                )}
              </div>
            ) : (
              <div className="w-full h-64 flex items-center justify-center">
                <span className="text-zinc-600">No image available</span>
              </div>
            )}
          </motion.div>

          {/* Image thumbnail strip */}
          {build.images.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {build.images.map((img, index) => (
                <button
                  key={`thumb-${index}`}
                  onClick={() => setSelectedImageIndex(index)}
                  className={cn(
                    "relative flex-shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 transition-all",
                    index === selectedImageIndex
                      ? "border-red-600 ring-1 ring-red-600/50"
                      : "border-[#27272a] hover:border-zinc-600 opacity-60 hover:opacity-100"
                  )}
                >
                  <Image
                    src={img.url}
                    alt={img.alt || `${build.title} thumbnail ${index + 1}`}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Title + metadata header */}
          <div className="mt-6 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {build.title}
              </h2>
              <GradeBadge grade={build.grade} />
              <span className="text-sm text-zinc-500">{build.scale}</span>
              {build.status === "WIP" && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  WIP
                </span>
              )}
              {build.status === "Abandoned" && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-500/20 text-zinc-400 border border-zinc-500/30">
                  {build.status}
                </span>
              )}
            </div>

            <p className="text-sm text-zinc-400">{build.kitName}</p>
          </div>

          {/* Reaction bar */}
          <div className="mt-6">
            <ReactionBar
              buildId={build.id}
              respectCount={build.respectCount}
              techniqueCount={build.techniqueCount}
              creativityCount={build.creativityCount}
              userReactions={build.userReactions ?? []}
              currentUserId={currentUserId}
            />
          </div>

          {/* Metadata grid */}
          {metadataItems.length > 0 && (
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {metadataItems.map((item) => (
                <div
                  key={item.label}
                  className="bg-[#18181b] border border-[#27272a] rounded-lg p-4"
                >
                  <dt className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
                    {item.label}
                  </dt>
                  <dd className="text-sm text-zinc-200 mt-1">{item.value}</dd>
                </div>
              ))}
            </div>
          )}

          {/* Techniques */}
          {build.techniques.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                {t("hangar.inspect.techniques")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {build.techniques.map((tech) => (
                  <TechniqueChip key={tech} technique={tech} size="md" />
                ))}
              </div>
            </div>
          )}

          {/* Intent statement */}
          {build.intentStatement && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                {t("hangar.inspect.intent")}
              </h3>
              <blockquote className="border-l-2 border-red-600/50 pl-4 py-2 text-zinc-300 italic text-sm leading-relaxed bg-red-600/5 rounded-r-lg pr-4">
                {build.intentStatement}
              </blockquote>
            </div>
          )}

          {/* Build DNA Panel */}
          <div className="mt-8">
            <BuildDnaPanel build={build} />
          </div>

          {/* Build Timeline */}
          {build.buildLog && build.buildLog.length > 0 && (
            <div className="mt-8">
              <BuildTimeline entries={build.buildLog} />
            </div>
          )}

          {/* Link to full passport */}
          <div className="mt-10 pb-8">
            <Link
              href={`/builds/${build.slug}`}
              className={cn(
                "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg",
                "bg-red-600/10 border border-red-600/30 text-red-400",
                "hover:bg-red-600/20 hover:border-red-600/50",
                "transition-colors text-sm font-medium"
              )}
            >
              {t("hangar.inspect.viewPassport")}
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
