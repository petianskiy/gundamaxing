"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/context";

/* ── Card data ─────────────────────────────────────────────── */

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
  ap: number | null;
  hp: number | null;
  image: string;
  backImage: string;
  border: string;
  glow: string;
}

// Back images by card category
const BACK_STANDARD = "/images/cards/usualbackside.jpg";

const CARDS: GCGCard[] = [
  {
    id: "G003-074", rarity: "R", rarityBg: "#2d1f5a", rarityColor: "#a78bfa",
    type: "UNIT", typeColor: "#9b85e8",
    lv: 3, cost: 2,
    name: "Tieren Taozi", subname: "MSJ-06II-SP",
    abilities: "During Pair — While you have another (Superpower Bloc) Unit in play, enemy Units must choose this rested Unit as their attack target.",
    traits: ["Space", "Earth"],
    ap: 3, hp: 1,
    image: "/images/cards/unitcard.jpg",
    backImage: BACK_STANDARD,
    border: "rgba(155,133,232,0.5)", glow: "rgba(155,133,232,0.3)",
  },
  {
    id: "GD03-087", rarity: "C", rarityBg: "#3a4a5a", rarityColor: "#8ab4c9",
    type: "PILOT", typeColor: "#4ade80",
    lv: 3, cost: 1,
    name: "Sarah Zabiarov", subname: "(Titans) (Jupitris) (Newtype)",
    abilities: "Burst — Add this card to your hand. When Linked — Choose 1 enemy Unit Lv.3 or lower. Rest it.",
    traits: [],
    ap: null, hp: null,
    image: "/images/cards/pilotcard.jpg",
    backImage: BACK_STANDARD,
    border: "rgba(74,222,128,0.4)", glow: "rgba(74,222,128,0.25)",
  },
  {
    id: "SP-XXX", rarity: "C+", rarityBg: "#2a3a4a", rarityColor: "#aac4d9",
    type: "COMMAND", typeColor: "#e879b0",
    lv: 2, cost: 1,
    name: "With Iron and Blood", subname: "",
    abilities: "Main / Action — Choose 1 of your Units. Deal 1 damage to it. It gets AP+3 during this turn.",
    traits: [],
    ap: null, hp: null,
    image: "/images/cards/commandcard.jpg",
    backImage: BACK_STANDARD,
    border: "rgba(232,121,176,0.5)", glow: "rgba(232,121,176,0.35)",
  },
  {
    id: "G002-128", rarity: "C", rarityBg: "#3a4a5a", rarityColor: "#8ab4c9",
    type: "BASE", typeColor: "#b07fff",
    lv: 4, cost: 2,
    name: "Hammerhead", subname: "Teiwaz Warship",
    abilities: "Burst — Deploy this card. Deploy — Add 1 Shield to your hand. If a (Teiwaz) Link Unit is in play, destroy 1 enemy Unit with 2 or less AP.",
    traits: ["Space"],
    ap: 0, hp: 5,
    image: "/images/cards/basecard.jpg",
    backImage: BACK_STANDARD,
    border: "rgba(180,127,255,0.5)", glow: "rgba(180,127,255,0.3)",
  },
];

/* ── Single flip card ──────────────────────────────────────── */

function FlipCard({ card, index }: { card: GCGCard; index: number }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      onClick={() => setFlipped((f) => !f)}
      className="relative cursor-pointer select-none"
      style={{ aspectRatio: "200/280", perspective: "1000px" }}
    >
      {/* Glow on hover when not yet flipped */}
      {!flipped && (
        <div
          className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ boxShadow: `0 0 28px ${card.glow}` }}
        />
      )}

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
        <div
          style={{
            position: "absolute", inset: 0,
            borderRadius: 14,
            overflow: "hidden",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <img
            src={card.backImage}
            alt="card back"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            draggable={false}
          />
        </div>

        {/* ── FRONT ── */}
        <div
          style={{
            position: "absolute", inset: 0,
            borderRadius: 14,
            overflow: "hidden",
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            border: `2px solid ${card.border}`,
          }}
        >
          {/* Full-card artwork — the image IS the card */}
          <img
            src={card.image}
            alt={card.name}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", display: "block" }}
            draggable={false}
          />

          {/* Type banner — vertical left strip */}
          <div
            style={{
              position: "absolute", left: 0, top: 0, bottom: 0, width: 18, zIndex: 4,
              background: `${card.typeColor}33`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <span style={{
              fontFamily: "sans-serif", fontSize: 7, fontWeight: 700,
              letterSpacing: 3, textTransform: "uppercase",
              color: card.typeColor, writingMode: "vertical-rl",
              transform: "rotate(180deg)",
            }}>
              {card.type}
            </span>
          </div>

          {/* Lv / Cost — top left */}
          {card.lv !== null && (
            <div style={{ position: "absolute", top: 6, left: 22, zIndex: 5 }}>
              <div style={{ fontFamily: "sans-serif", fontSize: 8, color: "rgba(255,255,255,0.7)", lineHeight: 1 }}>Lv.</div>
              <div style={{ fontFamily: "sans-serif", fontSize: 24, fontWeight: 900, color: "#fff", lineHeight: 0.9, textShadow: `0 0 10px ${card.typeColor}` }}>{card.lv}</div>
              <div style={{ fontFamily: "sans-serif", fontSize: 7, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>COST {card.cost}</div>
            </div>
          )}

          {/* Card ID + rarity — top right */}
          <div style={{
            position: "absolute", top: 6, right: 6, zIndex: 5,
            background: "rgba(0,0,0,0.55)", borderRadius: 4, backdropFilter: "blur(4px)",
            padding: "2px 5px", display: "flex", alignItems: "center", gap: 4,
          }}>
            <span style={{ fontFamily: "sans-serif", fontSize: 7, color: "rgba(255,255,255,0.8)", letterSpacing: 0.5 }}>{card.id}</span>
            <span style={{ fontFamily: "sans-serif", fontSize: 7, fontWeight: 700, padding: "1px 4px", borderRadius: 2, background: card.rarityBg, color: card.rarityColor }}>{card.rarity}</span>
          </div>

          {/* Bottom gradient + text overlay */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 4,
            background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.75) 50%, transparent 100%)",
            padding: "28px 8px 8px 24px",
          }}>
            <div style={{ fontFamily: "sans-serif", fontSize: 12, fontWeight: 700, color: "#fff", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.name}</div>
            {card.subname && <div style={{ fontFamily: "sans-serif", fontSize: 8, color: "rgba(255,255,255,0.4)", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.subname}</div>}
            <div style={{ fontFamily: "sans-serif", fontSize: 7.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {card.abilities}
            </div>

            {/* Footer: traits + AP/HP */}
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
              <div style={{ display: "flex", gap: 3, flexWrap: "wrap", minWidth: 0 }}>
                {card.traits.map((tr) => (
                  <span key={tr} style={{ fontFamily: "sans-serif", fontSize: 6.5, fontWeight: 600, padding: "1px 4px", borderRadius: 2, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.1)", whiteSpace: "nowrap" }}>{tr}</span>
                ))}
              </div>
              {card.ap !== null && (
                <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                  {[card.ap, card.hp].map((v, i) => (
                    <div key={i} style={{ width: 22, height: 22, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", fontSize: 11, fontWeight: 700, color: "#fff", background: "#111820", border: `1.5px solid ${card.border}` }}>{v}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Section ───────────────────────────────────────────────── */

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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 sm:gap-7 max-w-xl sm:max-w-none mx-auto">
          {CARDS.map((card, i) => (
            <FlipCard key={card.id} card={card} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
