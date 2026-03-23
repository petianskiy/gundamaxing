"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/context";

/* ── Shared flip card component used across the page ───────── */

export interface GCGCardData {
  id: string;
  name: string;
  image: string;       // front face photo
  backImage: string;   // back face photo
  border: string;
  glow: string;
}

export const BACK_STANDARD = "/images/cards/usualbackside.jpg";
export const BACK_RESOURCE = "/images/cards/backsideofresourcecards.jpg";
export const BACK_TOKEN    = "/images/cards/backsideoftokencards.jpg";

const SHOWCASE_CARDS: GCGCardData[] = [
  { id: "unit",    name: "Tieren Taozi",          image: "/images/cards/unitcard.jpg",    backImage: BACK_STANDARD, border: "rgba(155,133,232,0.5)", glow: "rgba(155,133,232,0.3)" },
  { id: "pilot",   name: "Sarah Zabiarov",         image: "/images/cards/pilotcard.jpg",   backImage: BACK_STANDARD, border: "rgba(74,222,128,0.4)",  glow: "rgba(74,222,128,0.25)" },
  { id: "command", name: "With Iron and Blood",    image: "/images/cards/commandcard.jpg", backImage: BACK_STANDARD, border: "rgba(232,121,176,0.5)", glow: "rgba(232,121,176,0.35)" },
  { id: "base",    name: "Hammerhead",             image: "/images/cards/basecard.jpg",    backImage: BACK_STANDARD, border: "rgba(180,127,255,0.5)", glow: "rgba(180,127,255,0.3)" },
];

/* ── Reusable flip card ────────────────────────────────────── */

export function FlipCard({
  card,
  index,
  defaultFlipped = true,
  className = "",
}: {
  card: GCGCardData;
  index: number;
  defaultFlipped?: boolean;
  className?: string;
}) {
  const [flipped, setFlipped] = useState(defaultFlipped);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      onClick={() => setFlipped((f) => !f)}
      className={`relative cursor-pointer select-none ${className}`}
      style={{ aspectRatio: "200/280", perspective: "1000px" }}
    >
      {/* Subtle glow */}
      <div
        className="absolute inset-0 rounded-2xl transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: `0 0 24px ${card.glow}`, opacity: flipped ? 0.6 : 0 }}
      />

      {/* Flip container */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformStyle: "preserve-3d",
          transition: "transform 0.65s cubic-bezier(0.645, 0.045, 0.355, 1.000)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* ── BACK ── */}
        <div style={{ position: "absolute", inset: 0, borderRadius: 14, overflow: "hidden", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
          <img src={card.backImage} alt="card back" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} draggable={false} />
        </div>

        {/* ── FRONT — pure image, no overlays ── */}
        <div style={{ position: "absolute", inset: 0, borderRadius: 14, overflow: "hidden", transform: "rotateY(180deg)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", border: `2px solid ${card.border}` }}>
          <img src={card.image} alt={card.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", display: "block" }} draggable={false} />
        </div>
      </div>
    </motion.div>
  );
}

/* ── Showcase section ──────────────────────────────────────── */

export function CardShowcase() {
  const { t } = useTranslation();

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gx-red">
            四本の柱 &middot; {t("cards.showcase.eyebrow")}
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-white tracking-tight">
            {t("cards.showcase.title")}
          </h2>
          <p className="mt-3 text-zinc-400 max-w-md mx-auto text-sm">
            {t("cards.showcase.subtitle")}
          </p>
          <p className="mt-2 text-[11px] text-zinc-600 uppercase tracking-[0.15em]">
            ↑ Click any card to flip it
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 sm:gap-7 max-w-xl sm:max-w-none mx-auto">
          {SHOWCASE_CARDS.map((card, i) => (
            <FlipCard key={card.id} card={card} index={i} defaultFlipped={true} />
          ))}
        </div>
      </div>
    </section>
  );
}
