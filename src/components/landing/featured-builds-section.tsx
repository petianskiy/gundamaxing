"use client";

import { motion } from "framer-motion";
import { BuildCard } from "@/components/build/build-card";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import type { Build } from "@/lib/types";

interface FeaturedBuildsSectionProps {
  builds: Build[];
}

export function FeaturedBuildsSection({ builds }: FeaturedBuildsSectionProps) {
  const { t } = useTranslation();

  if (builds.length === 0) return null;

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gx-red">
              展示 &middot; Showcase
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              {t("featured.title")}
            </h2>
          </div>
          <Link
            href="/builds"
            className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("shared.viewAllBuilds")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {builds.map((build, i) => (
            <motion.div
              key={build.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <BuildCard build={build} />
            </motion.div>
          ))}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/builds"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("shared.viewAllBuilds")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
