"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Upload, ArrowRight } from "lucide-react";
import { HeroVideo } from "./hero-video";
import { FeaturedBuildMini } from "./featured-build-mini";
import { featuredBuildOfWeek } from "@/lib/mock/data";
import { useTranslation } from "@/lib/i18n/context";

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative h-screen min-h-[600px] max-h-[1000px] flex items-center justify-center overflow-hidden">
      {/* Video background */}
      <HeroVideo />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />

      {/* Noise layer */}
      <div className="noise-overlay" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          {/* Main text */}
          <div className="max-w-2xl">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 48 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="h-[2px] bg-gx-red mb-6"
            />

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight leading-[1.1]"
            >
              {t("hero.heading1")}
              <br />
              <span className="text-zinc-400">{t("hero.heading2")}</span>
              <br />
              <span className="text-gx-red text-2xl sm:text-3xl md:text-4xl font-semibold">
                ガンダム
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="mt-5 text-base sm:text-lg text-zinc-400 max-w-lg leading-relaxed"
            >
              {t("hero.description")}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-8 flex flex-col sm:flex-row gap-3"
            >
              <Link
                href="/upload"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gx-red text-white font-semibold text-sm hover:bg-red-700 transition-colors"
              >
                <Upload className="h-4 w-4" />
                {t("hero.uploadBuild")}
              </Link>
              <Link
                href="/builds"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-white/20 text-white font-semibold text-sm hover:bg-white/5 transition-colors"
              >
                {t("hero.exploreBuilds")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>

          {/* Featured Build Mini Card */}
          <div className="hidden lg:block">
            <FeaturedBuildMini build={featuredBuildOfWeek} />
          </div>
        </div>
      </div>

      {/* Bottom fade to page */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
