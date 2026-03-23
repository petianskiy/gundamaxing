"use client";

import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/context";

interface ShowcaseCard {
  title: string;
  subtitle: string;
  type: "unit" | "pilot" | "command" | "base";
  color: string;
  glow: string;
  border: string;
  image: string;
}

const CARDS: ShowcaseCard[] = [
  {
    title: "RX-78-2 Gundam",
    subtitle: "Unit Card",
    type: "unit",
    color: "from-blue-500/20 to-blue-900/40",
    glow: "rgba(59,130,246,0.35)",
    border: "border-blue-500/30",
    image: "https://cdn.gundamaxing.com/builds/cmmqfyndi0001jp049b23m0k0/images/1773579887357-emmbn1.jpeg",
  },
  {
    title: "Amuro Ray",
    subtitle: "Pilot Card",
    type: "pilot",
    color: "from-emerald-500/20 to-emerald-900/40",
    glow: "rgba(16,185,129,0.35)",
    border: "border-emerald-500/30",
    image: "https://cdn.gundamaxing.com/builds/cmmr0ukao0000k304qlqrfsod/images/1773574191542-c6y11u.jpg",
  },
  {
    title: "Newtype Flash",
    subtitle: "Command Card",
    type: "command",
    color: "from-violet-500/20 to-violet-900/40",
    glow: "rgba(139,92,246,0.35)",
    border: "border-violet-500/30",
    image: "https://cdn.gundamaxing.com/builds/cmmrf8wvj0000l604i57s0mo5/images/1773570358836-uog8m1.jpg",
  },
  {
    title: "White Base",
    subtitle: "Base Card",
    type: "base",
    color: "from-amber-500/20 to-amber-900/40",
    glow: "rgba(245,158,11,0.35)",
    border: "border-amber-500/30",
    image: "https://cdn.gundamaxing.com/builds/cmmrcfd860000ky04txv6mlt5/images/1773568559623-7l6z02.jpg",
  },
];

function HoloCard({ card, index }: { card: ShowcaseCard; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("");
  const [holoAngle, setHoloAngle] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTransform(`perspective(800px) rotateY(${dx * 12}deg) rotateX(${-dy * 8}deg) scale3d(1.04,1.04,1.04)`);
    setHoloAngle(Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI));
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTransform("");
    setIsHovered(false);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      ref={cardRef}
      className="group relative cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: "800px" }}
    >
      {/* Glow border */}
      <div
        className={`absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 ${isHovered ? "opacity-100" : ""}`}
        style={{
          background: `conic-gradient(from ${holoAngle}deg, #ff0080, #ff8c00, #40e0d0, #a855f7, #ff0080)`,
        }}
      />

      {/* Card body */}
      <div
        className={`relative rounded-2xl overflow-hidden ${card.border} border bg-gradient-to-br ${card.color} backdrop-blur-sm`}
        style={{
          transform,
          transition: transform ? "transform 0.1s ease" : "transform 0.4s cubic-bezier(0.23,1,0.32,1)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Holographic overlay */}
        <div
          className="absolute inset-0 z-10 pointer-events-none mix-blend-color-dodge transition-opacity duration-300"
          style={{
            opacity: isHovered ? 0.3 : 0,
            background: `conic-gradient(from ${holoAngle}deg, #ff000055, #ff7f0055, #ffff0055, #00ff0055, #0000ff55, #8b00ff55, #ff000055)`,
          }}
        />

        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={card.image}
            alt={card.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            loading="lazy"
          />
          {/* Scan lines */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.08]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)",
            }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

          {/* Type badge */}
          <div className="absolute top-3 left-3 z-20">
            <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-black/60 border border-white/10 backdrop-blur-sm text-white/80">
              {card.subtitle}
            </span>
          </div>

          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/20 rounded-tl-2xl z-20" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-white/20 rounded-tr-2xl z-20" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-white/20 rounded-bl-2xl z-20" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/20 rounded-br-2xl z-20" />

          {/* Title */}
          <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
            <h3 className="text-sm font-bold text-white tracking-wide">{card.title}</h3>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function CardShowcase() {
  const { t } = useTranslation();

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-400">
              {t("cards.showcase.eyebrow")}
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-white tracking-tight">
              {t("cards.showcase.title")}
            </h2>
            <p className="mt-3 text-zinc-400 max-w-lg mx-auto">
              {t("cards.showcase.subtitle")}
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {CARDS.map((card, i) => (
            <HoloCard key={card.type} card={card} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
