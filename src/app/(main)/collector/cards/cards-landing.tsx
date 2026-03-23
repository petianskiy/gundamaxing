"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { CardShowcase } from "./components/card-showcase";
import { GameGuide } from "./components/game-guide";
import { DeckBuilder } from "./components/deck-builder";
import { CardCollection } from "./components/card-collection";
import { AppDownload } from "./components/app-download";

export function CardsLanding() {
  const { t } = useTranslation();

  return (
    <div className="relative min-h-screen pt-20">
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

      {/* ═══ CARD SHOWCASE ═══ */}
      <CardShowcase />

      {/* ═══ CARD COLLECTION ═══ */}
      <CardCollection />

      {/* ═══ GAME GUIDE ═══ */}
      <GameGuide />

      {/* ═══ DECK BUILDER ═══ */}
      <DeckBuilder />

      {/* ═══ APP DOWNLOAD ═══ */}
      <AppDownload />

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
