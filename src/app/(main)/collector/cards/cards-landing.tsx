"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Layers, BookOpen, Swords, Shield, Zap, Users, ChevronRight,
  Target, Clock, Trophy, Sparkles, ArrowRight, ExternalLink,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { CardShowcase } from "./components/card-showcase";
import { GameGuide } from "./components/game-guide";
import { DeckBuilder } from "./components/deck-builder";
import { CardsCatalog } from "./cards-catalog";

interface CardProduct {
  id: string;
  code: string;
  name: string;
  type: string;
  description: string | null;
  seriesTheme: string | null;
  releaseDate: string | null;
  price: number | null;
  currency: string;
  imageUrl: string | null;
  officialUrl: string | null;
  isFeatured: boolean;
}

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export function CardsLanding({ products }: { products: CardProduct[] }) {
  const { t } = useTranslation();

  return (
    <div className="relative min-h-screen">
      {/* Fixed background */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-b from-[#070a12] via-[#0c1020] to-black" />
      <div
        className="fixed inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* ═══ HERO ═══ */}
      <section className="relative pt-28 sm:pt-36 pb-24 sm:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-500/[0.07] rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="flex items-center justify-center gap-2.5 mb-6"
          >
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-indigo-400/60" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-indigo-400">
              {t("cards.hero.eyebrow")}
            </span>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-indigo-400/60" />
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08]"
          >
            <span className="bg-gradient-to-r from-white via-white to-indigo-200 bg-clip-text text-transparent">
              {t("cards.hero.title")}
            </span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="mt-5 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed"
          >
            {t("cards.hero.subtitle")}
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <a
              href="#guide"
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30"
            >
              <BookOpen className="h-4 w-4" />
              {t("cards.hero.learnCta")}
              <ChevronRight className="h-3.5 w-3.5 opacity-50 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href="#catalog"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 text-sm font-medium transition-all"
            >
              <Layers className="h-4 w-4" />
              {t("cards.hero.browseCta")}
            </a>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={4}
            className="mt-16 flex items-center justify-center gap-8 sm:gap-14"
          >
            {[
              { value: "4", label: t("cards.stats.cardTypes") },
              { value: "50", label: t("cards.stats.deckSize") },
              { value: "5", label: t("cards.stats.phases") },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wider mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ CARD SHOWCASE ═══ */}
      <CardShowcase />

      {/* ═══ GAME GUIDE ═══ */}
      <GameGuide />

      {/* ═══ DECK BUILDER ═══ */}
      <DeckBuilder />

      {/* ═══ PRODUCT CATALOG ═══ */}
      <section id="catalog" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-400">
                {t("cards.catalog.eyebrow")}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              {t("cards.catalog.title")}
            </h2>
            <p className="mt-3 text-zinc-400 max-w-lg mx-auto">
              {t("cards.catalog.subtitle")}
            </p>
          </div>
          <CardsCatalog products={products} />
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/40 to-transparent p-10 sm:p-14"
          >
            <div className="absolute inset-0 rounded-2xl bg-indigo-500/[0.04]" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
                {t("cards.cta.title")}
              </h2>
              <p className="text-zinc-400 max-w-md mx-auto mb-8">
                {t("cards.cta.subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="https://www.gundam-gcg.com/en/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-600/20"
                >
                  {t("cards.cta.officialSite")}
                  <ExternalLink className="h-3.5 w-3.5 opacity-50" />
                </a>
                <Link
                  href="/collector"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 text-sm font-medium transition-all"
                >
                  {t("cards.cta.backToCollector")}
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
