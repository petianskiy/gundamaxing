"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { User, Settings, Shield, LogOut, ChevronDown, Warehouse } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";

const tierRingColor: Record<string, string> = {
  MASTER: "ring-yellow-500",
  FEATURED: "ring-purple-500",
  VERIFIED: "ring-blue-500",
  UNVERIFIED: "ring-zinc-600",
};

export function UserMenu() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!session?.user) return null;

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 p-1 rounded-full hover:bg-muted/50 transition-colors"
        aria-label="User menu"
      >
        <div
          className={cn(
            "relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-offset-1 ring-offset-background",
            tierRingColor[session.user.verificationTier] || "ring-zinc-600"
          )}
        >
          {session.user.image ? (
            <Image src={session.user.image} alt="" fill className="object-cover" unoptimized />
          ) : (
            <div className="w-full h-full bg-gx-red/20 flex items-center justify-center">
              <User className="h-4 w-4 text-gx-red" />
            </div>
          )}
        </div>
        <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 rounded-xl border border-border/50 bg-card shadow-xl overflow-hidden z-50"
          >
            {/* User info */}
            <div className="px-4 py-3 border-b border-border/50">
              <p className="text-sm font-semibold text-foreground truncate">
                {session.user.name || session.user.username}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {session.user.email}
              </p>
            </div>

            {/* Links */}
            <div className="py-1">
              <Link
                href={`/u/${session.user.username}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <User className="h-4 w-4" />
                {t("auth.profile")}
              </Link>
              <Link
                href={`/hangar/${session.user.username}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <Warehouse className="h-4 w-4" />
                {t("nav.hangar")}
              </Link>
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <Settings className="h-4 w-4" />
                {t("auth.settings")}
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gx-gold hover:bg-muted/50 transition-colors"
                >
                  <Shield className="h-4 w-4" />
                  {t("auth.adminPanel")}
                </Link>
              )}
            </div>

            {/* Sign out */}
            <div className="py-1 border-t border-border/50">
              <button
                onClick={() => {
                  setOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-muted/50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                {t("auth.signOut")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
