"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Layers, Lock } from "lucide-react";
import Link from "next/link";

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
      <div style={{
        position: "absolute", inset: 0,
        transformStyle: "preserve-3d",
        transition: "transform 0.65s cubic-bezier(0.645, 0.045, 0.355, 1.000)",
        transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
      }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 12, overflow: "hidden", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
          <img src={BACK_STANDARD} alt="card back" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} draggable={false} />
        </div>
        <div style={{ position: "absolute", inset: 0, borderRadius: 12, overflow: "hidden", transform: "rotateY(180deg)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", border: `2px solid ${card.border}`, boxShadow: flipped ? `0 0 20px ${card.glow}` : "none" }}>
          <img src={card.image} alt={card.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", display: "block" }} draggable={false} />
        </div>
      </div>
    </motion.div>
  );
}

function LockedButton() {
  const [showTip, setShowTip] = useState(false);

  return (
    <div className="relative inline-flex">
      <button
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        onFocus={() => setShowTip(true)}
        onBlur={() => setShowTip(false)}
        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-sm font-semibold text-zinc-500 cursor-not-allowed"
        aria-disabled="true"
      >
        <Lock className="h-4 w-4" />
        Add Your Collectible Card
      </button>
      {showTip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-zinc-800 border border-white/10 text-xs text-zinc-300 whitespace-nowrap z-10">
          Coming soon — we&apos;re working on this!
        </div>
      )}
    </div>
  );
}

export function CollectibleCardsSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Layers className="h-4 w-4 text-gx-red" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gx-red">
              カードコレクション &middot; Card Collection
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Showcase Your Collectible Cards
          </h2>
        </motion.div>

        {/* Cards in a row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 sm:gap-7 max-w-xl sm:max-w-none mx-auto mb-3">
          {CARDS.map((card, i) => (
            <FlipCard key={card.id} card={card} index={i} />
          ))}
        </div>

        <p className="text-center text-[11px] text-zinc-600 uppercase tracking-[0.15em] mb-10">
          ↑ Click any card to flip it
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <LockedButton />
          <Link
            href="/collector/cards"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gx-red hover:bg-red-500 text-white text-sm font-semibold transition-all shadow-lg shadow-gx-red/20"
          >
            <Layers className="h-4 w-4" />
            Explore Collectible Cards
          </Link>
        </div>
      </div>
    </section>
  );
}
