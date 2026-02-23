"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { GitFork, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";

export function BuildDnaTeaser() {
  const { t } = useTranslation();

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <GitFork className="h-5 w-5 text-gx-red" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gx-red">
                系譜 &middot; Build DNA
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              {t("dna.title")}
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed max-w-lg">
              {t("dna.description")}
            </p>
            <Link
              href="/lineages"
              className="inline-flex items-center gap-2 mt-6 text-sm font-medium text-gx-red hover:text-red-400 transition-colors"
            >
              {t("dna.explore")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Blueprint schematic */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="relative rounded-xl border border-border/50 overflow-hidden mecha-frame"
          >
            <Image
              src="/gundam-blueprint.jpg"
              alt="RX-78-2 Gundam technical blueprint schematic"
              width={640}
              height={900}
              className="w-full h-auto object-cover"
              unoptimized
            />
            {/* Subtle overlay for integration */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-background/30" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
