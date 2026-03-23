"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Layers, ScanLine, BadgeCheck, LayoutGrid, ArrowRight } from "lucide-react";

/* ── Inline flip card (no external dep needed) ─────────────── */

const BACK_STANDARD = "/images/cards/usualbackside.jpg";

const CARDS = [
  { id: "unit",    name: "Unit",    image: "/images/cards/unitcard.jpg",    border: "rgba(155,133,232,0.5)", glow: "rgba(155,133,232,0.3)" },
  { id: "pilot",   name: "Pilot",   image: "/images/cards/pilotcard.jpg",   border: "rgba(74,222,128,0.4)",  glow: "rgba(74,222,128,0.25)" },
  { id: "command", name: "Command", image: "/images/cards/commandcard.jpg", border: "rgba(232,121,176,0.5)", glow: "rgba(232,121,176,0.35)" },
  { id: "base",    name: "Base",    image: "/images/cards/basecard.jpg",    border: "rgba(180,127,255,0.5)", glow: "rgba(180,127,255,0.3)" },
];

function FlipCard({ card, index }: { card: typeof CARDS[0]; index: number }) {
  const [flipped, setFlipped] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.09 }}
      onClick={() => setFlipped((f) => !f)}
      className="relative cursor-pointer select-none"
      style={{ aspectRatio: "200/280", perspective: "1000px" }}
    >
      <div
        style={{
          position: "absolute", inset: 0,
          transformStyle: "preserve-3d",
          transition: "transform 0.65s cubic-bezier(0.645, 0.045, 0.355, 1.000)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Back */}
        <div style={{ position: "absolute", inset: 0, borderRadius: 12, overflow: "hidden", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
          <img src={BACK_STANDARD} alt="card back" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} draggable={false} />
        </div>
        {/* Front */}
        <div style={{ position: "absolute", inset: 0, borderRadius: 12, overflow: "hidden", transform: "rotateY(180deg)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", border: `2px solid ${card.border}`, boxShadow: flipped ? `0 0 20px ${card.glow}` : "none" }}>
          <img src={card.image} alt={card.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", display: "block" }} draggable={false} />
        </div>
      </div>
    </motion.div>
  );
}

/* ── Feature pill ───────────────────────────────────────────── */

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 w-8 h-8 rounded-lg bg-gx-red/10 border border-gx-red/20 flex items-center justify-center text-gx-red">
        {icon}
      </div>
      <p className="text-sm text-zinc-400 leading-relaxed pt-1">{text}</p>
    </div>
  );
}

/* ── Main section ───────────────────────────────────────────── */

export function CollectibleCardsSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">

          {/* ── Left: cards ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="grid grid-cols-2 gap-4 max-w-xs sm:max-w-sm mx-auto lg:mx-0">
              {CARDS.map((card, i) => (
                <FlipCard key={card.id} card={card} index={i} />
              ))}
            </div>
            <p className="mt-3 text-center lg:text-left text-[11px] text-zinc-600 uppercase tracking-[0.15em]">
              ↑ Click any card to flip it
            </p>
          </motion.div>

          {/* ── Right: text + CTAs ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Layers className="h-4 w-4 text-gx-red" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gx-red">
                カードコレクション &middot; Card Collection
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight">
              Showcase Your Collectible Cards
            </h2>

            <p className="mt-4 text-muted-foreground leading-relaxed max-w-md">
              Add your Gundam Card Game cards to your profile and display them alongside your Gunpla builds.
              Each card carries a unique code — scan it to verify ownership and make your collection yours.
            </p>

            <div className="mt-8 space-y-4">
              <Feature
                icon={<ScanLine className="h-4 w-4" />}
                text="Scan the card code to verify ownership — no duplicates, no fakes. Your collection is authenticated."
              />
              <Feature
                icon={<BadgeCheck className="h-4 w-4" />}
                text="Verified cards appear on your public profile alongside your Gunpla builds, in one unified showcase."
              />
              <Feature
                icon={<LayoutGrid className="h-4 w-4" />}
                text="Browse, filter and organise your entire collection — by type, rarity, or set — in your personal hangar."
              />
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button className="group inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gx-red hover:bg-red-500 text-white text-sm font-semibold transition-all shadow-lg shadow-gx-red/20">
                <ScanLine className="h-4 w-4" />
                Add Your Collectible Card
                <ArrowRight className="h-3.5 w-3.5 opacity-50 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border/50 bg-card hover:bg-gx-surface-elevated text-sm font-medium text-muted-foreground hover:text-foreground transition-all">
                <Layers className="h-4 w-4" />
                Browse the Card Game
              </button>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
