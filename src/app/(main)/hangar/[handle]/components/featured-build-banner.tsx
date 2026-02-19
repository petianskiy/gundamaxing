"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import { GradeBadge } from "@/components/ui/grade-badge";
import { VerificationBadge } from "@/components/ui/verification-badge";
import type { Build } from "@/lib/types";

interface FeaturedBuildBannerProps {
  build: Build;
}

export function FeaturedBuildBanner({ build }: FeaturedBuildBannerProps) {
  const { t } = useTranslation();
  const primaryImage = build.images.find((img) => img.isPrimary) || build.images[0];

  if (!primaryImage) return null;

  return (
    <Link href={`/builds/${build.slug}`}>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-xl overflow-hidden cursor-pointer group border border-border/50"
    >
      {/* Cinematic aspect ratio */}
      <div className="relative aspect-[21/9] max-h-[360px]">
        <Image
          src={primaryImage.url}
          alt={primaryImage.alt || build.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          style={primaryImage.objectPosition ? { objectPosition: primaryImage.objectPosition } : undefined}
          unoptimized
          priority
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Featured label */}
        <div className="absolute top-4 left-4">
          <span className={cn(
            "px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest",
            "bg-gx-red/90 text-white"
          )}>
            {t("hangar.hero.featured")}
          </span>
        </div>

        {/* Content overlay — left side */}
        <div className="absolute inset-y-0 left-0 flex flex-col justify-end p-6 sm:p-8 max-w-lg">
          <div className="flex items-center gap-2 mb-2">
            <GradeBadge grade={build.grade} />
            <span className="text-xs font-mono text-zinc-400">{build.scale}</span>
            {build.verification !== "unverified" && (
              <VerificationBadge tier={build.verification} size="md" />
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight line-clamp-2">
            {build.title}
          </h2>
          <p className="text-sm text-zinc-400 mt-1 line-clamp-1">
            {build.kitName}
          </p>

          <div className="mt-4">
            <span className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
              "bg-white/10 text-white border border-white/20 backdrop-blur-sm",
              "group-hover:bg-white/20 group-hover:border-white/30 transition-colors"
            )}>
              <Eye className="h-4 w-4" />
              {t("hangar.inspectBuild")}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
    </Link>
  );
}
