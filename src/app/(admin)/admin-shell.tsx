"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Shield, Flag, Activity, Users, LayoutDashboard, BarChart3,
  FileText, Tags, Settings2, Target, MessageSquare, BookOpen,
  HelpCircle, LayoutTemplate, Palette, Layers, Trophy, Menu, X, ArrowLeft,
} from "lucide-react";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/forum", label: "Forum", icon: MessageSquare },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/roles", label: "Roles", icon: Tags },
  { href: "/admin/events", label: "Events", icon: Activity },
  { href: "/admin/missions", label: "Missions", icon: Target },
  { href: "/admin/collector", label: "Collector", icon: BookOpen },
  { href: "/admin/cards", label: "Cards", icon: Layers },
  { href: "/admin/achievements", label: "Achievements", icon: Trophy },
  { href: "/admin/guide", label: "Guide", icon: HelpCircle },
  { href: "/admin/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/admin/themes", label: "Themes", icon: Palette },
  { href: "/admin/settings", label: "Settings", icon: Settings2 },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-border/50 bg-gx-surface p-4 flex-col gap-1 shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 mb-4">
          <Shield className="h-5 w-5 text-gx-gold" />
          <span className="text-sm font-bold tracking-wider text-foreground">ADMIN PANEL</span>
        </div>
        {adminNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
              pathname === item.href
                ? "text-foreground bg-muted/50 font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
        <div className="mt-auto pt-4 border-t border-border/50">
          <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to site
          </Link>
        </div>
      </aside>

      {/* Mobile: hamburger header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-gx-surface border-b border-border/50 flex items-center gap-3 px-4 py-3 safe-top">
        <button onClick={() => setMenuOpen(true)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
          <Menu className="h-5 w-5" />
        </button>
        <Shield className="h-4 w-4 text-gx-gold" />
        <span className="text-xs font-bold tracking-wider text-foreground">ADMIN</span>
      </div>

      {/* Mobile: slide-out menu */}
      {menuOpen && (
        <>
          <div className="lg:hidden fixed inset-0 z-50 bg-black/60" onClick={() => setMenuOpen(false)} />
          <div className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 bg-gx-surface border-r border-border/50 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 px-2">
                <Shield className="h-5 w-5 text-gx-gold" />
                <span className="text-sm font-bold tracking-wider text-foreground">ADMIN</span>
              </div>
              <button onClick={() => setMenuOpen(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-1">
              {adminNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors",
                    pathname === item.href
                      ? "text-foreground bg-muted/50 font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-border/50">
              <Link href="/" className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to site
              </Link>
            </div>
          </div>
        </>
      )}

      {/* Main content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto lg:pt-8 pt-16">
        {children}
      </main>
    </div>
  );
}
