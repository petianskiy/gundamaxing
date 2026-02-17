"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Heart } from "lucide-react";
import { GradeBadge } from "@/components/ui/grade-badge";
import type { Build } from "@/lib/types";
import { useTranslation } from "@/lib/i18n/context";

export function FeaturedBuildMini({ build }: { build: Build }) {
  const { t } = useTranslation();
  const primaryImage = build.images.find((img) => img.isPrimary) || build.images[0];

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
    >
      <Link href={`/builds/${build.id}`} className="group block">
        <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl p-3 w-[280px] hover:border-white/20 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-3.5 w-3.5 text-yellow-500" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-yellow-500/80">
              {t("hero.buildOfWeek")}
            </span>
          </div>
          <div className="flex gap-3">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={primaryImage.url}
                alt={primaryImage.alt}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-white line-clamp-2 leading-tight">
                {build.title}
              </h4>
              <div className="flex items-center gap-2 mt-1.5">
                <GradeBadge grade={build.grade} />
                <span className="flex items-center gap-0.5 text-[10px] text-zinc-400">
                  <Heart className="h-2.5 w-2.5" />
                  {build.likes >= 1000
                    ? `${(build.likes / 1000).toFixed(1)}k`
                    : build.likes}
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                {t("shared.by")} {build.username}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
