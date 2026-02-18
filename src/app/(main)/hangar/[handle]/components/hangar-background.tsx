"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

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

export function HangarBackground() {
  const [idx, setIdx] = useState(0);

  const advance = useCallback(() => {
    setIdx((p) => (p + 1) % BACKGROUNDS.length);
  }, []);

  useEffect(() => {
    const t = setInterval(advance, INTERVAL);
    return () => clearInterval(t);
  }, [advance]);

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
