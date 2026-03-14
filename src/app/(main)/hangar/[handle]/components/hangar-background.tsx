"use client";

import { useState, useEffect, useCallback } from "react";
import { SmartImage as Image } from "@/components/ui/smart-image";
import { motion, AnimatePresence } from "framer-motion";
import type { HangarLayout } from "@/lib/types";

const BACKGROUNDS = [
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

const INTERVAL = 8000;

interface HangarBackgroundProps {
  layout?: HangarLayout;
}

export function HangarBackground({ layout }: HangarBackgroundProps) {
  const [idx, setIdx] = useState(0);

  const advance = useCallback(() => {
    setIdx((p) => (p + 1) % BACKGROUNDS.length);
  }, []);

  useEffect(() => {
    if (layout === "DOME_GALLERY") return;
    const t = setInterval(advance, INTERVAL);
    return () => clearInterval(t);
  }, [advance, layout]);

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
            src={BACKGROUNDS[idx]}
            alt=""
            fill
            className="object-cover"
            priority={idx === 0}
            sizes="100vw"
          />
        </motion.div>
      </AnimatePresence>

      {/* Overlay stack for readability */}
      <div className="absolute inset-0 bg-black/60 z-[1]" />
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
