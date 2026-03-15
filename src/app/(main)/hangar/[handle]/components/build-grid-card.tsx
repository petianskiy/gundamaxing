"use client";

import { SmartImage as Image } from "@/components/ui/smart-image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, MessageCircle, GitFork, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { GradeBadge } from "@/components/ui/grade-badge";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { TechniqueChip } from "@/components/ui/technique-chip";
import type { Build } from "@/lib/types";

interface BuildGridCardProps {
  build: Build;
  isPinned?: boolean;
}

export function BuildGridCard({ build, isPinned }: BuildGridCardProps) {
  const primaryImage = build.images.find((img) => img.isPrimary) || build.images[0];
  const shownTechniques = build.techniques.slice(0, 2);
  const remainingCount = build.techniques.length - 2;

  return (
    <Link href={`/builds/${build.slug}`} className="h-full">
    <motion.article
      layoutId={`build-${build.id}`}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "group relative rounded-xl border overflow-hidden cursor-pointer h-full flex flex-col",
        "bg-card shadow-sm hover:shadow-lg transition-[border-color,box-shadow] duration-300",
        isPinned
          ? "border-gx-red/30 hover:border-gx-red/50"
          : "border-border/50 hover:border-border"
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted shrink-0">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt || build.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            style={primaryImage.objectPosition ? { objectPosition: primaryImage.objectPosition } : undefined}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            No Image
          </div>
        )}

        {/* Top-left: Grade + Scale */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <GradeBadge grade={build.grade} />
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-black/60 text-zinc-300 backdrop-blur-sm">
            {build.scale}
          </span>
        </div>

        {/* Top-right: Verification */}
        {build.verification !== "unverified" && (
          <div className="absolute top-2.5 right-2.5 p-1 rounded-full bg-black/50 backdrop-blur-sm">
            <VerificationBadge tier={build.verification} size="md" />
          </div>
        )}

        {/* Bottom-left: WIP badge */}
        {build.status === "WIP" && (
          <div className="absolute bottom-2.5 left-2.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/90 text-black backdrop-blur-sm">
              WIP
            </span>
          </div>
        )}

        {/* Pinned indicator */}
        {isPinned && (
          <div className="absolute top-2.5 left-2.5 mt-7">
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-gx-red/90 text-white backdrop-blur-sm">
              <Pin className="h-2.5 w-2.5" />
            </span>
          </div>
        )}

        {/* Bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1 gap-2.5">
        {/* Title & kit name */}
        <div>
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-card-foreground group-hover:text-foreground transition-colors">
            {build.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {build.kitName}
          </p>
        </div>

        {/* Techniques — max 2 full tags + overflow count */}
        <div className="flex gap-1 items-center min-h-[22px]">
          {shownTechniques.map((tech) => (
            <TechniqueChip key={tech} technique={tech} size="sm" />
          ))}
          {remainingCount > 0 && (
            <span className="inline-flex items-center px-2 py-[2px] rounded text-[11px] leading-[1.4] font-medium bg-zinc-800 text-zinc-400 shrink-0 whitespace-nowrap">
              +{remainingCount}
            </span>
          )}
        </div>

        {/* Footer stats — pinned to bottom */}
        <div className="flex items-center gap-3 text-muted-foreground pt-1.5 border-t border-border/50 mt-auto">
          <span className="flex items-center gap-1 text-xs">
            <Heart className="h-3 w-3" />
            {build.likes >= 1000
              ? `${(build.likes / 1000).toFixed(1)}k`
              : build.likes}
          </span>
          <span className="flex items-center gap-1 text-xs">
            <MessageCircle className="h-3 w-3" />
            {build.comments}
          </span>
          <span className="flex items-center gap-1 text-xs">
            <GitFork className="h-3 w-3" />
            {build.forkCount}
          </span>
        </div>
      </div>
    </motion.article>
    </Link>
  );
}
