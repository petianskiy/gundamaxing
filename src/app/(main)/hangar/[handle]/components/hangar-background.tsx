"use client";

import { useState, useEffect, useCallback } from "react";
import { SmartImage as Image } from "@/components/ui/smart-image";
import { motion, AnimatePresence } from "framer-motion";
import type { HangarLayout } from "@/lib/types";

const DEFAULT_BACKGROUNDS = [
  "/hangar/backgrounds/bg-01.jpg",
  "/hangar/backgrounds/bg-02.jpg",
  "/hangar/backgrounds/bg-03.jpg",
  "/hangar/backgrounds/bg-04.jpg",
  "/hangar/backgrounds/bg-05.jpg",
  "/hangar/backgrounds/bg-06.jpg",
  "/hangar/backgrounds/bg-07.jpg",
  "/hangar/backgrounds/bg-08.jpg",
  "/hangar/backgrounds/bg-09.webp",
  "/hangar/backgrounds/bg-10.jpg",
];

const DEFAULT_INTERVAL = 8000;

export interface ThemeConfig {
  backgroundType: string;
  backgroundImages: string[] | null;
  backgroundVideoUrl: string | null;
  backgroundPosterUrl: string | null;
  carouselInterval: number;
  dimness: number;
}

interface HangarBackgroundProps {
  layout?: HangarLayout;
  themeConfig?: ThemeConfig | null;
}

export function HangarBackground({ layout, themeConfig }: HangarBackgroundProps) {
  const backgrounds = themeConfig?.backgroundImages?.length
    ? themeConfig.backgroundImages
    : DEFAULT_BACKGROUNDS;
  const interval = themeConfig?.carouselInterval
    ? themeConfig.carouselInterval * 1000
    : DEFAULT_INTERVAL;
  const dimness = themeConfig?.dimness ?? 0.6;
  const bgType = themeConfig?.backgroundType ?? "carousel";

  const [idx, setIdx] = useState(0);

  const advance = useCallback(() => {
    setIdx((p) => (p + 1) % backgrounds.length);
  }, [backgrounds.length]);

  useEffect(() => {
    if (layout === "DOME_GALLERY") return;
    if (bgType === "static" || bgType === "video") return;
    const t = setInterval(advance, interval);
    return () => clearInterval(t);
  }, [advance, layout, bgType, interval]);

  // Dome Gallery layout: deep space background
  if (layout === "DOME_GALLERY") {
    return (
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 50% 40%, #0d1117 0%, #070a0f 40%, #020204 100%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 z-[1]" />
      </div>
    );
  }

  // Video background
  if (bgType === "video" && themeConfig?.backgroundVideoUrl) {
    return (
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={themeConfig.backgroundPosterUrl || undefined}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={themeConfig.backgroundVideoUrl} />
        </video>

        {/* Dimness overlay */}
        <div
          className="absolute inset-0 z-[1]"
          style={{ backgroundColor: `rgba(0, 0, 0, ${dimness})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 z-[1]" />
        <div
          className="absolute inset-0 z-[2]"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)",
          }}
        />
      </div>
    );
  }

  // Static background
  if (bgType === "static" && backgrounds.length > 0) {
    return (
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        <Image
          src={backgrounds[0]}
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />

        {/* Dimness overlay */}
        <div
          className="absolute inset-0 z-[1]"
          style={{ backgroundColor: `rgba(0, 0, 0, ${dimness})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 z-[1]" />
        <div
          className="absolute inset-0 z-[2]"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)",
          }}
        />
      </div>
    );
  }

  // Default: crossfading image carousel
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      {/* Crossfading images */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={idx}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={backgrounds[idx]}
            alt=""
            fill
            className="object-cover"
            priority={idx === 0}
            sizes="100vw"
          />
        </motion.div>
      </AnimatePresence>

      {/* Dimness overlay */}
      <div
        className="absolute inset-0 z-[1]"
        style={{ backgroundColor: `rgba(0, 0, 0, ${dimness})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 z-[1]" />
      <div
        className="absolute inset-0 z-[2]"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)",
        }}
      />
    </div>
  );
}
