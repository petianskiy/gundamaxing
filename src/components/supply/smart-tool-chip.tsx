"use client";

import { useState, useEffect } from "react";
import { SupplyChip } from "./supply-chip";
import { searchSupplyCatalog } from "@/lib/actions/supply";
import type { BuildSupplyItem } from "@/lib/types";

interface SmartToolChipProps {
  tool: string;
  style?: React.CSSProperties;
}

/**
 * Attempts to match a free-text tool string against the supply catalog.
 * If a strong/exact match is found, renders as an interactive SupplyChip.
 * Otherwise renders as a plain text chip.
 */
export function SmartToolChip({ tool, style }: SmartToolChipProps) {
  const [matched, setMatched] = useState<BuildSupplyItem | null>(null);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    let cancelled = false;
    searchSupplyCatalog(tool).then((results) => {
      if (cancelled) return;
      // Only use a match if confidence is exact or strong
      const top = results[0] as (typeof results)[0] & { confidence?: string } | undefined;
      if (top && (top.confidence === "exact" || top.confidence === "strong")) {
        setMatched({
          id: top.id,
          brand: top.brand,
          name: top.name,
          code: top.code,
          category: top.category,
          colorHex: top.colorHex ?? null,
          slug: top.slug ?? "",
        });
      }
      setTried(true);
    }).catch(() => setTried(true));
    return () => { cancelled = true; };
  }, [tool]);

  if (matched) {
    return <SupplyChip supply={matched} style={style} />;
  }

  // Plain chip (shown immediately — no loading state to avoid flickering)
  return (
    <span
      className="bg-zinc-800 text-zinc-300 border border-zinc-700"
      style={style}
    >
      {tool}
    </span>
  );
}
