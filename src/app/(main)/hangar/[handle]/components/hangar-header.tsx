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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mb-8"
    >
      <div className="flex flex-col sm:flex-row items-start gap-5">
        {/* Avatar */}
        <div
          className={cn(
            "relative h-20 w-20 rounded-full ring-4 ring-offset-4 ring-offset-[#09090b] overflow-hidden bg-muted flex-shrink-0",
            tierRingColor[user.verificationTier] || "ring-zinc-600"
          )}
        >
          {user.avatar ? (
            <Image
              src={user.avatar}
              alt={user.displayName || user.username}
              width={80}
              height={80}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-2xl font-bold text-muted-foreground bg-[#18181b]">
              {(user.displayName || user.username)[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Identity info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {user.displayName || user.username}
            </h1>
            <VerificationBadge
              tier={user.verificationTier.toLowerCase() as "unverified" | "verified" | "featured" | "master"}
              showLabel
              size="md"
            />
            {isOwner && (
              <Link
                href="/settings/hangar"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-muted/50 text-muted-foreground hover:text-foreground border border-border/50 hover:border-border transition-colors ml-auto"
              >
                <Pencil className="h-3 w-3" />
                {t("hangar.editHangar")}
              </Link>
            )}
          </div>

          <p className="text-sm text-muted-foreground mt-0.5">
            @{user.handle}
          </p>

          {/* Manifesto */}
          {user.manifesto && (
            <blockquote className="border-l-2 border-[#dc2626]/40 pl-4 mt-4">
              <p className="text-sm text-zinc-400 italic leading-relaxed">
                &ldquo;{user.manifesto}&rdquo;
              </p>
            </blockquote>
          )}

          {/* Social links */}
          {Object.keys(user.socialLinks).length > 0 && (
            <div className="flex gap-2 mt-4">
              {Object.entries(user.socialLinks).map(([platform, url]) => {
                const Icon = socialIcons[platform] || ExternalLink;
                return (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    title={platform}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
