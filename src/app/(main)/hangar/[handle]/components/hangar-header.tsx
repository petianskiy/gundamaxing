"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Pencil,
  Globe,
  Twitter,
  Youtube,
  Instagram,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import { VerificationBadge } from "@/components/ui/verification-badge";
import type { HangarUser } from "@/lib/types";

const tierRingColor: Record<string, string> = {
  MASTER: "ring-yellow-500",
  FEATURED: "ring-purple-500",
  VERIFIED: "ring-blue-500",
  UNVERIFIED: "ring-zinc-600",
};

const socialIcons: Record<string, React.ElementType> = {
  twitter: Twitter,
  youtube: Youtube,
  instagram: Instagram,
  website: Globe,
};

interface HangarHeaderProps {
  user: HangarUser;
  isOwner: boolean;
}

export function HangarHeader({ user, isOwner }: HangarHeaderProps) {
  const { t } = useTranslation();

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" as const }}
    >
      <div className="flex items-center gap-4 p-3 sm:p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/5">
        {/* Avatar */}
        <div
          className={cn(
            "relative h-12 w-12 sm:h-14 sm:w-14 rounded-full ring-2 ring-offset-2 ring-offset-transparent overflow-hidden bg-zinc-900 flex-shrink-0",
            tierRingColor[user.verificationTier] || "ring-zinc-600"
          )}
        >
          {user.avatar ? (
            <Image
              src={user.avatar}
              alt={user.displayName || user.username}
              width={56}
              height={56}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-lg font-bold text-zinc-500 bg-zinc-900">
              {(user.displayName || user.username)[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
              {user.displayName || user.username}
            </h1>
            <VerificationBadge
              tier={user.verificationTier.toLowerCase() as "unverified" | "verified" | "featured" | "master"}
              size="sm"
            />
          </div>
          <p className="text-xs text-white/40">@{user.username}</p>
        </div>

        {/* Manifesto (desktop only) */}
        {user.manifesto && (
          <div className="hidden lg:block max-w-sm">
            <p className="text-xs text-white/50 italic leading-relaxed line-clamp-2">
              &ldquo;{user.manifesto}&rdquo;
            </p>
          </div>
        )}

        {/* Social links */}
        <div className="hidden sm:flex items-center gap-1.5">
          {Object.entries(user.socialLinks).slice(0, 4).map(([platform, url]) => {
            const Icon = socialIcons[platform] || ExternalLink;
            return (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                title={platform}
              >
                <Icon className="h-3.5 w-3.5" />
              </a>
            );
          })}
        </div>

        {/* Edit button */}
        {isOwner && (
          <Link
            href="/settings/hangar"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10 transition-all"
          >
            <Pencil className="h-3 w-3" />
            <span className="hidden sm:inline">{t("hangar.editHangar")}</span>
          </Link>
        )}
      </div>

      {/* Manifesto (mobile only) */}
      {user.manifesto && (
        <div className="lg:hidden mt-3 px-1">
          <p className="text-xs text-white/40 italic leading-relaxed line-clamp-2">
            &ldquo;{user.manifesto}&rdquo;
          </p>
        </div>
      )}
    </motion.header>
  );
}
