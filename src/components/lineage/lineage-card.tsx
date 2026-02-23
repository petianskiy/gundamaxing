"use client";

import Image from "next/image";
import Link from "next/link";
import { GitFork, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import type { LineageSummary } from "@/lib/types";

interface LineageCardProps {
  lineage: LineageSummary;
  showActions?: boolean;
  onDelete?: (id: string) => void;
  onTogglePublic?: (id: string) => void;
}

export function LineageCard({ lineage, showActions, onDelete, onTogglePublic }: LineageCardProps) {
  const { t } = useTranslation();

  return (
    <Link href={`/lineages/${lineage.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card hover:border-gx-red/30 transition-all duration-300">
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-gx-red/20 z-10" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-gx-red/20 z-10" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-gx-red/20 z-10" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-gx-red/20 z-10" />

        {/* Thumbnail stack */}
        <div className="relative h-32 bg-zinc-900/50 overflow-hidden">
          {lineage.previewBuilds.length > 0 ? (
            <div className="flex items-center justify-center h-full gap-1 px-4">
              {lineage.previewBuilds.map((build, i) => {
                const primaryImage = build.images.find(img => img.isPrimary) || build.images[0];
                return primaryImage ? (
                  <div
                    key={build.id}
                    className={cn(
                      "relative rounded-lg overflow-hidden border border-border/30 shadow-lg",
                      i === 0 ? "w-24 h-24 z-30" : i === 1 ? "w-20 h-20 z-20 -ml-4 opacity-80" : "w-16 h-16 z-10 -ml-4 opacity-60"
                    )}
                  >
                    <Image
                      src={primaryImage.url}
                      alt={build.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : null;
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <GitFork className="h-8 w-8 text-muted-foreground/30" />
            </div>
          )}

          {/* Node count badge */}
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[10px] font-medium text-zinc-300 z-20">
            {lineage.nodeCount === 1
              ? t("lineage.card.build")
              : t("lineage.card.builds").replace("{{count}}", String(lineage.nodeCount))}
          </div>

          {/* Private badge */}
          {!lineage.isPublic && (
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[10px] font-medium text-yellow-400 flex items-center gap-1 z-20">
              <Lock className="h-2.5 w-2.5" />
              {t("lineage.card.private")}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-sm font-bold text-foreground truncate group-hover:text-gx-red transition-colors">
            {lineage.title}
          </h3>
          {lineage.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {lineage.description}
            </p>
          )}

          {/* Author */}
          <div className="mt-3 flex items-center gap-2">
            {lineage.userAvatar && (
              <div className="relative w-5 h-5 rounded-full overflow-hidden ring-1 ring-border/50 flex-shrink-0">
                <Image src={lineage.userAvatar} alt={lineage.username} fill className="object-cover" unoptimized />
              </div>
            )}
            <span className="text-[11px] text-muted-foreground truncate">{lineage.username}</span>
            <span className="text-[10px] text-muted-foreground/50 ml-auto">{lineage.updatedAt}</span>
          </div>
        </div>

        {/* Actions for mine page */}
        {showActions && (
          <div className="px-4 pb-3 flex gap-2" onClick={(e) => e.preventDefault()}>
            {onTogglePublic && (
              <button
                onClick={() => onTogglePublic(lineage.id)}
                className="text-[10px] px-2 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-foreground transition-colors"
              >
                {lineage.isPublic ? t("lineage.detail.private") : t("lineage.detail.public")}
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(lineage.id)}
                className="text-[10px] px-2 py-1 rounded bg-zinc-800 text-red-400 hover:text-red-300 transition-colors"
              >
                {t("lineage.action.delete")}
              </button>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
