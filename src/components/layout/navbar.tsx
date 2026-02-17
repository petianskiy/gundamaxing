"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Upload, Grid3X3, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import { LanguageToggle } from "@/components/ui/language-toggle";

const navLinks = [
  { href: "/builds", labelKey: "nav.builds", icon: Grid3X3 },
  { href: "/forum", labelKey: "nav.forum", icon: MessageSquare },
  { href: "/upload", labelKey: "nav.upload", icon: Upload },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl safe-top">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <Image
              src="/gundam-emoji.png"
              alt="Gundam"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-[0.2em] text-foreground">
                GUNDAMAXING
              </span>
              <span className="h-[2px] w-full bg-gx-red" />
              <span className="text-[8px] text-muted-foreground/40 tracking-[0.3em] font-mono mt-0.5">
                ガンダマクシング
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "text-foreground bg-muted"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {t(link.labelKey)}
                </Link>
              );
            })}
          </div>

          {/* Right side: Language toggle + Mobile toggle */}
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <button
              className="md:hidden p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={t("nav.toggleMenu")}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "text-foreground bg-muted"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <link.icon className="h-4 w-4" />
                    {t(link.labelKey)}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
