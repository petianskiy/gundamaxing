"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ScanLine, Layers, ArrowLeft, BadgeCheck } from "lucide-react";
import type { UserCardUI, CardCollectionStats } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ── Flip card for collection display ──────────────────────── */

const BACK_STANDARD = "/images/cards/usualbackside.jpg";
const BACK_RESOURCE = "/images/cards/backsideofresourcecards.jpg";
const BACK_TOKEN = "/images/cards/backsideoftokencards.jpg";

function getBackImage(type: string | null): string {
  if (type === "RESOURCE") return BACK_RESOURCE;
  if (type === "TOKEN") return BACK_TOKEN;
  return BACK_STANDARD;
}

function CollectionCard({ card, index }: { card: UserCardUI; index: number }) {
  const [flipped, setFlipped] = useState(true);
  const backImage = getBackImage(card.cardType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      onClick={() => setFlipped((f) => !f)}
      className="relative cursor-pointer select-none group"
      style={{ aspectRatio: "200/280", perspective: "1000px" }}
    >
      <div style={{
        position: "absolute", inset: 0, transformStyle: "preserve-3d",
        transition: "transform 0.65s cubic-bezier(0.645, 0.045, 0.355, 1.000)",
        transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
      }}>
        {/* Back */}
        <div style={{ position: "absolute", inset: 0, borderRadius: 12, overflow: "hidden", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
          <img src={backImage} alt="card back" style={{ width: "100%", height: "100%", objectFit: "cover" }} draggable={false} />
        </div>
        {/* Front */}
        <div style={{ position: "absolute", inset: 0, borderRadius: 12, overflow: "hidden", transform: "rotateY(180deg)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", border: "2px solid rgba(255,255,255,0.15)" }}>
          <img src={card.imageUrl} alt={card.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} draggable={false} />
          {/* Verified badge */}
          {card.isVerified && (
            <div className="absolute top-1.5 right-1.5 bg-green-500/80 rounded-full p-0.5">
              <BadgeCheck className="h-3 w-3 text-white" />
            </div>
          )}
          {/* Quantity badge */}
          {card.quantity > 1 && (
            <div className="absolute bottom-1.5 right-1.5 bg-black/70 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] font-bold text-white border border-white/10">
              x{card.quantity}
            </div>
          )}
        </div>
      </div>
      {/* Card name tooltip on hover */}
      <div className="absolute -bottom-6 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[10px] text-zinc-500 truncate block">{card.name}</span>
      </div>
    </motion.div>
  );
}

/* ── Main grid ─────────────────────────────────────────────── */

export function MyCardsGrid({ cards, stats }: { cards: UserCardUI[]; stats: CardCollectionStats }) {
  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-20 bg-gradient-to-b from-[#070a12] via-[#0c1020] to-black" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Header */}
        <Link
          href="/collector/cards"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Cards
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Layers className="h-4 w-4 text-gx-red" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gx-red">
                マイカード &middot; My Cards
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Your Collection
            </h1>
          </div>

          <Link
            href="/collector/cards/scanner"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gx-red hover:bg-red-500 text-white text-sm font-semibold transition-all"
          >
            <ScanLine className="h-4 w-4" />
            Scan Card
          </Link>
        </div>

        {/* Stats bar */}
        {stats.uniqueCards > 0 && (
          <div className="flex items-center gap-6 mb-8 pb-6 border-b border-white/[0.06]">
            <div className="text-center">
              <div className="text-xl font-bold text-white">{stats.totalCards}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Total</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-white">{stats.uniqueCards}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Unique</div>
            </div>
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="text-center">
                <div className="text-xl font-bold text-white">{count}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{type}</div>
              </div>
            ))}
          </div>
        )}

        {/* Cards grid */}
        {cards.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
            {cards.map((card, i) => (
              <CollectionCard key={card.id} card={card} index={i} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <Layers className="h-7 w-7 text-zinc-600" />
            </div>
            <p className="text-zinc-400 text-sm">No cards in your collection yet.</p>
            <Link
              href="/collector/cards/scanner"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gx-red hover:bg-red-500 text-white text-sm font-semibold transition-all"
            >
              <ScanLine className="h-4 w-4" />
              Scan Your First Card
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
