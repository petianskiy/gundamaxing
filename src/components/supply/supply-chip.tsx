"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Package, Paintbrush, Droplets, Layers, Wrench, Scissors } from "lucide-react";
import { SupplyPopover } from "./supply-popover";
import type { BuildSupplyItem } from "@/lib/types";

const CATEGORY_ICONS: Record<string, typeof Package> = {
  PAINT: Paintbrush, PRIMER: Layers, TOPCOAT: Layers, THINNER: Droplets,
  CEMENT: Droplets, PANEL_LINER: Paintbrush, MARKER: Paintbrush,
  TOOL: Wrench, ABRASIVE: Scissors, MASKING: Scissors,
  PUTTY: Package, DECAL: Package, OTHER: Package,
};

export function SupplyChip({ supply, style }: { supply: BuildSupplyItem; style?: React.CSSProperties }) {
  const [open, setOpen] = useState(false);
  const chipRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const Icon = CATEGORY_ICONS[supply.category] || Package;
  const label = supply.code
    ? `${supply.brand} ${supply.name} (${supply.code})`
    : `${supply.brand} ${supply.name}`;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        chipRef.current && !chipRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <span className="relative inline-block">
      <button
        ref={chipRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1 text-zinc-300 border transition-colors touch-manipulation",
          open
            ? "bg-gx-red/15 border-gx-red/30"
            : "bg-zinc-800 border-zinc-700 hover:border-zinc-500 hover:bg-zinc-700/70"
        )}
        style={{
          padding: style?.padding ?? "3px 8px",
          borderRadius: style?.borderRadius ?? "6px",
          fontSize: style?.fontSize ?? "11px",
          ...style,
        }}
      >
        {supply.colorHex ? (
          <span
            className="inline-block rounded-full border border-zinc-600 shrink-0"
            style={{ width: "0.7em", height: "0.7em", backgroundColor: supply.colorHex }}
          />
        ) : (
          <Icon style={{ width: "0.85em", height: "0.85em" }} className="text-zinc-500 shrink-0" />
        )}
        <span className="truncate">{label}</span>
      </button>

      {open && (
        <div ref={popoverRef}>
          <SupplyPopover supply={supply} onClose={() => setOpen(false)} />
        </div>
      )}
    </span>
  );
}
