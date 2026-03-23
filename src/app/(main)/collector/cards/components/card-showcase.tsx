"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/context";

/* ── Card data ──────────────────────────────────────────────── */

interface GCGCard {
  id: string;
  rarity: string;
  rarityBg: string;
  rarityColor: string;
  type: string;
  typeColor: string;
  lv: number | null;
  cost: number | null;
  name: string;
  subname: string;
  abilities: string;
  traits: string[];
  faction: string;
  ap: number | null;
  hp: number | null;
  image: string;
  border: string;
  glow: string;
  panel: string;
  holo?: boolean;
}

const CARDS: GCGCard[] = [
  {
    id: "G003-074", rarity: "R", rarityBg: "#2d1f5a", rarityColor: "#a78bfa",
    type: "UNIT", typeColor: "#9b85e8",
    lv: 3, cost: 2,
    name: "Tieren Taozi", subname: "MSJ-06II-SP",
    abilities: "During Pair — While you have another (Superpower Bloc) Unit in play, enemy Units choose this rested Unit as their attack target if possible.",
    traits: ["Space", "Earth"], faction: "(Superpower Bloc)",
    ap: 3, hp: 1,
    image: "/images/cards/unitcard.jpg",
    border: "rgba(155,133,232,0.45)", glow: "rgba(155,133,232,0.35)", panel: "rgba(10,8,28,0.94)",
  },
  {
    id: "GD03-087", rarity: "C", rarityBg: "#3a4a5a", rarityColor: "#8ab4c9",
    type: "PILOT", typeColor: "#4ade80",
    lv: 3, cost: 1,
    name: "Sarah Zabiarov", subname: "(Titans) (Jupitris) (Newtype)",
    abilities: "Burst — Add this card to your hand. When Linked — Choose 1 enemy Unit that is Lv.3 or lower. Rest it.",
    traits: [], faction: "",
    ap: null, hp: null,
    image: "/images/cards/pilotcard.jpg",
    border: "rgba(74,222,128,0.35)", glow: "rgba(74,222,128,0.3)", panel: "rgba(4,20,10,0.94)",
  },
  {
    id: "SP-XXX", rarity: "C+", rarityBg: "#2a3a4a", rarityColor: "#aac4d9",
    type: "COMMAND", typeColor: "#e879b0",
    lv: 2, cost: 1,
    name: "With Iron and Blood", subname: "",
    abilities: "Main / Action — Choose 1 of your Units. Deal 1 damage to it. It gets AP+3 during this turn.",
    traits: [], faction: "",
    ap: null, hp: null,
    image: "/images/cards/commandcard.jpg",
    border: "rgba(232,121,176,0.5)", glow: "rgba(232,121,176,0.45)", panel: "rgba(20,4,18,0.85)",
    holo: true,
  },
  {
    id: "G002-128", rarity: "C", rarityBg: "#3a4a5a", rarityColor: "#8ab4c9",
    type: "BASE", typeColor: "#b07fff",
    lv: 4, cost: 2,
    name: "Hammerhead", subname: "Teiwaz Warship",
    abilities: "Burst — Deploy this card. Deploy — Add 1 of your Shields to your hand. Then, if it is your turn and a friendly (Teiwaz) Link Unit is in play, choose 1 enemy Unit with 2 or less AP. Destroy it.",
    traits: ["Space"], faction: "(Teiwaz) (Warship)",
    ap: 0, hp: 5,
    image: "/images/cards/basecard.jpg",
    border: "rgba(180,127,255,0.45)", glow: "rgba(180,127,255,0.35)", panel: "rgba(12,8,28,0.94)",
  },
];

/* ── GCG Card Back (faithful recreation) ───────────────────── */

function CardBack() {
  return (
    <div
      className="absolute inset-0 rounded-[14px] overflow-hidden"
      style={{
        background: "#e8ecf0",
        border: "1.5px solid #c0cad8",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
      }}
    >
      {/* Blue side bars */}
      <div className="absolute left-0 top-0 bottom-0 w-[13px] z-10"
        style={{ background: "linear-gradient(to bottom, #7aaad8 0%, #5a8ec8 20%, #4a7ec0 50%, #5a8ec8 80%, #7aaad8 100%)" }} />
      <div className="absolute right-0 top-0 bottom-0 w-[13px] z-10"
        style={{ background: "linear-gradient(to bottom, #7aaad8 0%, #5a8ec8 20%, #4a7ec0 50%, #5a8ec8 80%, #7aaad8 100%)" }} />
      {/* Bottom connector tabs */}
      <div className="absolute bottom-0 left-0 w-[13px] h-[18px] z-10" style={{ background: "#4a7ec0" }} />
      <div className="absolute bottom-0 right-0 w-[13px] h-[18px] z-10" style={{ background: "#4a7ec0" }} />
      {/* Top notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-1.5 z-20 rounded-b-sm" style={{ background: "#5a8ec8" }} />
      {/* Corner accents */}
      <div className="absolute top-0 left-[13px] w-9 h-9 z-10 opacity-70"
        style={{ background: "linear-gradient(135deg, #c8d4e0 0%, #b8c8d8 100%)", clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
      <div className="absolute top-0 right-[13px] w-9 h-9 z-10 opacity-70"
        style={{ background: "linear-gradient(135deg, #c8d4e0 0%, #b8c8d8 100%)", clipPath: "polygon(0 0, 100% 0, 100% 100%)" }} />
      <div className="absolute bottom-0 left-[13px] w-9 h-9 z-10 opacity-70"
        style={{ background: "linear-gradient(135deg, #c8d4e0 0%, #b8c8d8 100%)", clipPath: "polygon(0 0, 0 100%, 100% 100%)" }} />
      <div className="absolute bottom-0 right-[13px] w-9 h-9 z-10 opacity-70"
        style={{ background: "linear-gradient(135deg, #c8d4e0 0%, #b8c8d8 100%)", clipPath: "polygon(100% 0, 0 100%, 100% 100%)" }} />
      {/* Frosted central panel */}
      <div className="absolute z-[5]"
        style={{ left: 13, right: 13, top: 0, bottom: 0, background: "linear-gradient(175deg, rgba(200,218,240,0.85) 0%, rgba(230,240,255,0.92) 30%, rgba(210,228,248,0.88) 60%, rgba(195,215,238,0.82) 100%)" }}>
        {/* Linen texture */}
        <div className="absolute inset-0" style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 3px), repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.08) 2px, rgba(255,255,255,0.08) 3px)"
        }} />
        {/* Logo + text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
          <svg viewBox="0 0 62 62" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14">
            <rect x="26" y="26" width="22" height="22" rx="1.5" stroke="#3a6aaa" strokeWidth="2.5" fill="rgba(58,106,170,0.15)" />
            <line x1="34" y1="26" x2="34" y2="48" stroke="#3a6aaa" strokeWidth="1.2" opacity="0.5" />
            <line x1="26" y1="34" x2="48" y2="34" stroke="#3a6aaa" strokeWidth="1.2" opacity="0.5" />
            <rect x="14" y="14" width="22" height="22" rx="1.5" stroke="#3a6aaa" strokeWidth="2.5" fill="rgba(58,106,170,0.15)" />
            <line x1="22" y1="14" x2="22" y2="36" stroke="#3a6aaa" strokeWidth="1.2" opacity="0.5" />
            <line x1="14" y1="22" x2="36" y2="22" stroke="#3a6aaa" strokeWidth="1.2" opacity="0.5" />
            <line x1="36" y1="26" x2="52" y2="10" stroke="#3a6aaa" strokeWidth="2" strokeLinecap="round" />
            <polygon points="52,10 46,14 48,20" fill="#3a6aaa" />
          </svg>
          <div className="text-center" style={{ fontFamily: "sans-serif" }}>
            <div className="text-[11px] font-bold tracking-[1.5px] leading-[1.3]" style={{ color: "#3a6aaa" }}>
              GUNDAM™<br />CARD GAME™
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── GCG Card Front ─────────────────────────────────────────── */

function CardFront({ card }: { card: GCGCard }) {
  return (
    <div
      className="absolute inset-0 rounded-[14px] overflow-hidden flex flex-col"
      style={{
        border: `2px solid ${card.border}`,
        background: "#12101e",
        transform: "rotateY(180deg)",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
      }}
    >
      {/* Holographic shimmer for holo cards */}
      {card.holo && (
        <div className="absolute inset-0 z-[8] pointer-events-none rounded-[12px] mix-blend-screen opacity-50"
          style={{ background: "conic-gradient(from 30deg at 50% 50%, rgba(255,0,128,0.12), rgba(255,140,0,0.12), rgba(64,224,208,0.12), rgba(168,85,247,0.12), rgba(255,0,128,0.12))", animation: "gcgHolo 8s linear infinite" }} />
      )}

      {/* Type banner — vertical left */}
      <div className="absolute left-0 top-0 bottom-0 w-[18px] z-[4] flex items-center justify-center"
        style={{ background: `${card.typeColor}22` }}>
        <span className="text-[7px] font-bold tracking-[3px] uppercase text-white"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", color: card.typeColor }}>
          {card.type}
        </span>
      </div>

      {/* Lv / Cost */}
      {card.lv !== null && (
        <div className="absolute top-1.5 left-[22px] z-[5] flex flex-col leading-none">
          <span className="text-[8px] font-semibold text-white/60 tracking-wide">Lv.</span>
          <span className="text-[24px] font-black text-white leading-none" style={{ fontFamily: "sans-serif" }}>{card.lv}</span>
          <span className="text-[7px] font-semibold text-white/50 mt-0.5">COST {card.cost}</span>
        </div>
      )}

      {/* Card ID + rarity */}
      <div className="absolute top-1.5 right-1.5 z-[5] flex items-center gap-1 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded-sm">
        <span className="text-[7px] font-medium text-white/80 tracking-wide">{card.id}</span>
        <span className="text-[7px] font-bold px-1 py-px rounded-[2px]"
          style={{ background: card.rarityBg, color: card.rarityColor }}>{card.rarity}</span>
      </div>

      {/* Art */}
      <div className="relative flex-1 overflow-hidden min-h-0">
        <img src={card.image} alt={card.name} className="w-full h-full object-cover object-top" loading="lazy" />
        {/* Scan lines */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)" }} />
      </div>

      {/* Text panel */}
      <div className="relative z-[3] flex-shrink-0 px-2.5 pb-2 pt-1.5 pl-6"
        style={{ background: card.panel, borderTop: `1px solid ${card.border}` }}>
        <div className="text-[12px] font-bold text-white leading-tight truncate">{card.name}</div>
        {card.subname && <div className="text-[8px] text-white/40 truncate mb-1">{card.subname}</div>}
        <div className="text-[7.5px] text-white/65 leading-[1.4] line-clamp-3">{card.abilities}</div>
      </div>

      {/* Footer: traits + AP/HP */}
      <div className="flex-shrink-0 flex items-center justify-between gap-1.5 px-2 py-1.5 pl-6 z-[3]"
        style={{ background: "rgba(0,0,0,0.6)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex gap-1 flex-wrap min-w-0">
          {card.traits.map((t) => (
            <span key={t} className="text-[6.5px] font-semibold px-1 py-px rounded-[2px] border border-white/10 text-white/40 bg-white/[0.07] whitespace-nowrap">{t}</span>
          ))}
          {card.faction && <span className="text-[6.5px] text-white/30 truncate">{card.faction}</span>}
        </div>
        {card.ap !== null && (
          <div className="flex gap-0.5 flex-shrink-0">
            {[card.ap, card.hp].map((val, i) => (
              <div key={i} className="w-[22px] h-[22px] rounded-[4px] flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: "#111820", border: `1.5px solid ${card.border}` }}>{val}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Flip card wrapper ──────────────────────────────────────── */

function FlipCard({ card, index }: { card: GCGCard; index: number }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      onClick={() => setFlipped((f) => !f)}
      className="relative cursor-pointer"
      style={{ width: "100%", aspectRatio: "200/280", perspective: "1000px" }}
    >
      {/* Inner — flips on click */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformStyle: "preserve-3d",
          transition: "transform 0.65s cubic-bezier(0.645, 0.045, 0.355, 1.000)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        <CardBack />
        <CardFront card={card} />
      </div>

      {/* Hover lift when showing back */}
      {!flipped && (
        <style>{`
          .flip-hover-${index}:hover > div {
            transform: translateY(-5px) scale(1.02) !important;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          }
        `}</style>
      )}
    </motion.div>
  );
}

/* ── Main showcase section ──────────────────────────────────── */

export function CardShowcase() {
  const { t } = useTranslation();

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
      <style>{`
        @keyframes gcgHolo {
          from { filter: hue-rotate(0deg); }
          to   { filter: hue-rotate(360deg); }
        }
      `}</style>

      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-400">
            {t("cards.showcase.eyebrow")}
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-2xl sm:max-w-none mx-auto">
          {CARDS.map((card, i) => (
            <FlipCard key={card.id} card={card} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
