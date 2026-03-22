"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import type { KitStatus } from "@/lib/types";

const statusConfig: Record<KitStatus, { bg: string; text: string; border: string }> = {
  OWNED: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  BUILT: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/30" },
  WISHLIST: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  BACKLOG: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
};

export function CollectionStatusBadge({
  status,
  size = "sm",
}: {
  status: KitStatus;
  size?: "sm" | "md";
}) {
  const { t } = useTranslation();
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        config.bg,
        config.text,
        config.border,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
      )}
    >
      {t(`collector.status.${status}`)}
    </span>
  );
}
