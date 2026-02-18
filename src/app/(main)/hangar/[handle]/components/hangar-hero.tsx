"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import { GradeBadge } from "@/components/ui/grade-badge";
import type { Build } from "@/lib/types";

interface HangarHeroProps {
  build: Build | null;
  onInspect: () => void;
}

export function HangarHero({ build, onInspect }: HangarHeroProps) {
  const { t } = useTranslation();
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);

  if (!build) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        className="mb-8"
      >
        <div className="relative aspect-[16/9] rounded-xl border border-border/50 bg-[#18181b] flex flex-col items-center justify-center">
          <ImageOff className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            {t("hangar.noFeaturedBuild")}
          </p>
        </div>
      </motion.section>
    );
  }

  const primaryImage = build.images.find((img) => img.isPrimary) || build.images[0];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
      className="mb-8"
    >
      <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-border/50 group cursor-pointer" onClick={onInspect}>
        {/* Hero image */}
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt || build.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            style={primaryImage.objectPosition ? { objectPosition: primaryImage.objectPosition } : undefined}
            unoptimized
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-[#18181b]" />
        )}

        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Grade badge overlay */}
        <div className="absolute top-4 left-4 z-10">
          <GradeBadge grade={build.grade} />
        </div>

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
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#dc2626]/60" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-[#dc2626] border-2 border-white/80" />
            </span>
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

        {/* Title overlay at bottom */}
        <div className="absolute bottom-0 inset-x-0 p-5 z-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {build.title}
              </h2>
              <p className="text-sm text-zinc-300 mt-1">
                {build.kitName}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInspect();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#dc2626] hover:bg-red-700 text-white text-sm font-medium transition-colors flex-shrink-0"
            >
              <Search className="h-4 w-4" />
              {t("hangar.inspectBuild")}
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
