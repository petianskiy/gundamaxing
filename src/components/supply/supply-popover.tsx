"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import {
  Package, Paintbrush, Droplets, Layers, Wrench, Scissors,
  ExternalLink, X,
} from "lucide-react";
import { getStoreLinks } from "@/lib/supply/stores";
import { resolveLocaleRegion, getRegionPriority, type StoreRegion } from "@/lib/supply/regions";
import type { BuildSupplyItem } from "@/lib/types";

const CATEGORY_ICONS: Record<string, typeof Package> = {
  PAINT: Paintbrush, PRIMER: Layers, TOPCOAT: Layers, THINNER: Droplets,
  CEMENT: Droplets, PANEL_LINER: Paintbrush, MARKER: Paintbrush,
  TOOL: Wrench, ABRASIVE: Scissors, MASKING: Scissors,
  PUTTY: Package, DECAL: Package, OTHER: Package,
};

const CATEGORY_LABELS: Record<string, string> = {
  PAINT: "Paint", PRIMER: "Primer", TOPCOAT: "Topcoat", THINNER: "Thinner",
  CEMENT: "Cement", PANEL_LINER: "Panel Liner", MARKER: "Marker",
  TOOL: "Tool", ABRASIVE: "Abrasive", MASKING: "Masking",
  PUTTY: "Putty", DECAL: "Decal", OTHER: "Other",
};

const REGION_FLAGS: Record<StoreRegion, string> = {
  JP: "JP", CN: "CN", SEA: "SEA", EU: "EU", NA: "US", GLOBAL: "Global",
};

interface SupplyPopoverProps {
  supply: BuildSupplyItem;
  onClose: () => void;
}

export function SupplyPopover({ supply, onClose }: SupplyPopoverProps) {
  const { locale } = useTranslation();
  const Icon = CATEGORY_ICONS[supply.category] || Package;

  // Determine user region from locale (lightweight — no DB call needed)
  const region = resolveLocaleRegion(locale);
  const priority = getRegionPriority(region);
  const storeLinks = getStoreLinks(supply, priority);

  return (
    <div className="absolute z-50 left-0 top-full mt-1 w-72 sm:w-80 rounded-lg border border-border bg-card shadow-xl animate-in fade-in-0 zoom-in-95 duration-150">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 border-b border-border/50">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 min-w-0">
            {supply.colorHex ? (
              <span
                className="mt-1 h-5 w-5 rounded-full border border-border/50 shrink-0"
                style={{ backgroundColor: supply.colorHex }}
              />
            ) : (
              <Icon className="mt-1 h-5 w-5 text-muted-foreground shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{supply.brand}</p>
              <p className="text-sm font-medium text-foreground leading-snug">
                {supply.name}
                {supply.code && (
                  <span className="text-muted-foreground ml-1.5 font-mono text-xs">{supply.code}</span>
                )}
              </p>
              <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {CATEGORY_LABELS[supply.category] || supply.category}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0 touch-manipulation"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Store Links */}
      <div className="px-4 pt-2.5 pb-3">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Where to buy</p>
        <div className="space-y-1.5">
          {storeLinks.map((link) => (
            <a
              key={link.slug}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-2.5 py-2 rounded-md border border-border/40 bg-muted/30 hover:bg-muted/60 hover:border-border transition-colors group touch-manipulation"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-mono text-muted-foreground/70 w-7 shrink-0">
                  {REGION_FLAGS[link.region]}
                </span>
                <span className="text-sm text-foreground truncate">{link.name}</span>
              </div>
              <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-gx-red transition-colors shrink-0" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
