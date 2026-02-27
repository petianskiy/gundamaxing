"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Fingerprint, Eye, Shield, AlertTriangle, Warehouse } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";

const navItems = [
  { href: "/settings/profile", labelKey: "settings.nav.profile", icon: User },
  { href: "/settings/identity", labelKey: "settings.nav.identity", icon: Fingerprint },
  { href: "/settings/privacy", labelKey: "settings.nav.privacy", icon: Eye },
  { href: "/settings/hangar", labelKey: "settings.nav.hangar", icon: Warehouse },
  { href: "/settings/security", labelKey: "settings.nav.security", icon: Shield },
  { href: "/settings/account", labelKey: "settings.nav.account", icon: AlertTriangle },
];

export function SettingsNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-gx-red/10 text-gx-red border border-gx-red/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
