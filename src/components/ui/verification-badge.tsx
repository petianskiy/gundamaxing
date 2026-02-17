"use client";

import { cn } from "@/lib/utils";
import { Shield, ShieldCheck, Star, Crown } from "lucide-react";
import type { VerificationTier } from "@/lib/types";
import { useTranslation } from "@/lib/i18n/context";

const tierConfig: Record<VerificationTier, { icon: typeof Shield; className: string }> = {
  unverified: { icon: Shield, className: "text-zinc-500" },
  verified: { icon: ShieldCheck, className: "text-blue-500" },
  featured: { icon: Star, className: "text-purple-500" },
  master: { icon: Crown, className: "text-yellow-500" },
};

export function VerificationBadge({
  tier,
  showLabel = false,
  size = "sm",
}: {
  tier: VerificationTier;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const { t } = useTranslation();
  const config = tierConfig[tier];
  const Icon = config.icon;
  const sizeClass = size === "sm" ? "h-3.5 w-3.5" : size === "md" ? "h-4 w-4" : "h-5 w-5";

  const labelMap: Record<string, string> = {
    verified: t("verification.verified"),
    featured: t("verification.featured"),
    master: t("verification.master"),
  };

  if (tier === "unverified") return null;

  return (
    <span className={cn("inline-flex items-center gap-1", config.className)}>
      <Icon className={sizeClass} />
      {showLabel && <span className="text-xs font-medium">{labelMap[tier]}</span>}
    </span>
  );
}
