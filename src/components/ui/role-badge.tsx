"use client";

import { Shield, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoleBadgeProps {
  role: "USER" | "MODERATOR" | "ADMIN";
  customRoles?: Array<{
    displayName: string;
    color: string;
    icon: string | null;
  }>;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const roleConfig = {
  ADMIN: {
    label: "Admin",
    icon: Shield,
    baseClass: "text-red-400",
    glowClass: "animate-admin-glow",
    bgClass: "bg-red-500/15 border-red-500/30",
  },
  MODERATOR: {
    label: "Moderator",
    icon: ShieldCheck,
    baseClass: "text-amber-400",
    glowClass: "animate-mod-shimmer",
    bgClass: "bg-amber-500/15 border-amber-500/30",
  },
  USER: null,
} as const;

const sizeClasses = {
  sm: { text: "text-[10px]", icon: "h-3 w-3", px: "px-1.5 py-0.5" },
  md: { text: "text-xs", icon: "h-3.5 w-3.5", px: "px-2 py-0.5" },
  lg: { text: "text-sm", icon: "h-4 w-4", px: "px-2.5 py-1" },
};

export function RoleBadge({
  role,
  customRoles,
  showLabel = true,
  size = "sm",
}: RoleBadgeProps) {
  const config = roleConfig[role];
  const s = sizeClasses[size];

  return (
    <>
      {config && (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md border font-bold uppercase tracking-wider",
            s.text,
            s.px,
            config.bgClass,
            config.baseClass,
            config.glowClass,
          )}
        >
          <config.icon className={s.icon} />
          {showLabel && config.label}
        </span>
      )}
      {customRoles?.map((cr) => (
        <span
          key={cr.displayName}
          className={cn(
            "inline-flex items-center gap-1 rounded-md border font-medium uppercase tracking-wider animate-custom-glow",
            s.text,
            s.px,
          )}
          style={{
            color: cr.color,
            borderColor: `${cr.color}4d`,
            backgroundColor: `${cr.color}26`,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ["--glow-color" as any]: cr.color,
          }}
        >
          {cr.icon && <span className={s.icon}>{cr.icon}</span>}
          {showLabel && cr.displayName}
        </span>
      ))}
    </>
  );
}
