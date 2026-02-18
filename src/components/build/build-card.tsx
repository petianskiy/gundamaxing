"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, MessageCircle, GitFork, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { TechniqueChip } from "@/components/ui/technique-chip";
import { GradeBadge } from "@/components/ui/grade-badge";
import type { Build } from "@/lib/types";

export function BuildCard({ build }: { build: Build }) {
  const primaryImage = build.images.find((img) => img.isPrimary) || build.images[0];
  const shownTechniques = build.techniques.slice(0, 3);
  const remainingCount = build.techniques.length - 3;

  return (
    <Link href={`/builds/${build.id}`}>
      <motion.article
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          "group relative rounded-xl border border-border/50 bg-card overflow-hidden",
          "shadow-sm hover:shadow-lg hover:border-border transition-[border-color,box-shadow] duration-300"
        )}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt}
            fill
            className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
            style={primaryImage.objectPosition ? { objectPosition: primaryImage.objectPosition } : undefined}
            unoptimized
          />

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

          {/* Bottom-right: Image count */}
          {build.images.length > 1 && (
            <div className="absolute bottom-2.5 right-2.5">
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/60 text-zinc-300 backdrop-blur-sm">
                <Camera className="h-3 w-3" />
                {build.images.length}
              </span>
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

          {/* Bottom gradient */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title & kit name */}
          <div>
            <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-card-foreground group-hover:text-foreground transition-colors">
              {build.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {build.kitName}
            </p>
          </div>

          {/* Techniques */}
          <div className="flex flex-wrap gap-1">
            {shownTechniques.map((tech) => (
              <TechniqueChip key={tech} technique={tech} size="sm" />
            ))}
            {remainingCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-400">
                +{remainingCount}
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            {/* User */}
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="relative w-[18px] h-[18px] rounded-full overflow-hidden shrink-0">
                <Image
                  src={build.userAvatar}
                  alt={build.username}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <span className="text-xs text-muted-foreground truncate">
                {build.username}
              </span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 text-muted-foreground shrink-0">
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
        </div>
      </motion.article>
    </Link>
  );
}
