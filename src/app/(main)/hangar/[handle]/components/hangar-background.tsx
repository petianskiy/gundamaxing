"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
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
  "/hangar/backgrounds/bg-09.png",
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

  // Dome Gallery layout: looping video background
  if (layout === "DOME_GALLERY") {
    return (
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/dome-bg.mp4" type="video/mp4" />
          </video>
        </motion.div>

        {/* Light overlay — keep video vibrant */}
        <div className="absolute inset-0 bg-black/25 z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50 z-[1]" />
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
            unoptimized
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
