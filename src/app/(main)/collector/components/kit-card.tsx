"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, Users } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { GradeBadge } from "@/components/ui/grade-badge";
import { CollectionStatusBadge } from "./collection-status-badge";
import type { GunplaKitUI, KitStatus, Grade } from "@/lib/types";

export function KitCard({
  kit,
  userStatus,
}: {
  kit: GunplaKitUI;
  userStatus?: KitStatus | null;
}) {
  const { t } = useTranslation();

  return (
    <Link
      href={`/collector/${kit.slug}`}
      className="group relative flex flex-col rounded-xl border border-border/50 bg-card overflow-hidden transition-all hover:border-border hover:shadow-lg hover:shadow-black/20"
    >
      {/* Image */}
      <div className="relative aspect-square bg-muted/30 overflow-hidden">
        {kit.imageUrl ? (
          <Image
            src={kit.imageUrl}
            alt={kit.name}
            fill
            className="object-contain p-4 transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-4xl text-muted-foreground/20 font-rajdhani font-bold">
              {kit.grade}
            </div>
          </div>
        )}

        {/* User status badge overlay */}
        {userStatus && (
          <div className="absolute top-2 right-2">
            <CollectionStatusBadge status={userStatus} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 p-4">
        {/* Grade badge */}
        <div className="flex items-center gap-2">
          <GradeBadge grade={kit.grade as Grade} size="sm" />
          {kit.scale && (
            <span className="text-[10px] text-muted-foreground">{kit.scale}</span>
          )}
        </div>

        {/* Name */}
        <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-2 font-rajdhani">
          {kit.name}
        </h3>

        {/* Series */}
        <p className="text-[11px] text-muted-foreground truncate">{kit.seriesName}</p>

        {/* Stats */}
        <div className="mt-auto flex items-center justify-between pt-2 border-t border-border/30">
          <div className="flex items-center gap-1">
            {kit.avgRating !== null ? (
              <>
                <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-medium text-foreground">
                  {kit.avgRating.toFixed(1)}
                </span>
              </>
            ) : (
              <span className="text-[10px] text-muted-foreground/60">
                {t("collector.noRating")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-3 w-3" />
            <span className="text-[10px]">{kit.totalOwners}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
