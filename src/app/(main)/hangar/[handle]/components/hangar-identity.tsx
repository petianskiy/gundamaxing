"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Settings,
  Globe,
  Twitter,
  Youtube,
  Instagram,
  ExternalLink,
  Package,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VerificationBadge } from "@/components/ui/verification-badge";
import type { HangarUser } from "@/lib/types";

const tierRing: Record<string, string> = {
  MASTER: "ring-yellow-400/60",
  FEATURED: "ring-purple-400/60",
  VERIFIED: "ring-blue-400/60",
  UNVERIFIED: "ring-white/10",
};

const socialIcons: Record<string, React.ElementType> = {
  twitter: Twitter,
  youtube: Youtube,
  instagram: Instagram,
  website: Globe,
};

interface HangarIdentityProps {
  user: HangarUser;
  isOwner: boolean;
}

export function HangarIdentity({ user, isOwner }: HangarIdentityProps) {
  const name = user.displayName || user.username;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto flex items-center gap-4 sm:gap-5">
        {/* Avatar */}
        <div
          className={cn(
            "relative h-14 w-14 sm:h-16 sm:w-16 rounded-full ring-2 ring-offset-2 ring-offset-black/0 overflow-hidden flex-shrink-0",
            tierRing[user.verificationTier] || "ring-white/10"
          )}
        >
          {user.avatar ? (
            <Image
              src={user.avatar}
              alt={name}
              width={64}
              height={64}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xl font-bold text-white/30 bg-white/5">
              {name[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Name + handle */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
              {name}
            </h1>
            <VerificationBadge
              tier={
                user.verificationTier.toLowerCase() as
                  | "unverified"
                  | "verified"
                  | "featured"
                  | "master"
              }
              size="md"
            />
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-sm text-white/30">@{user.handle}</span>
            <span className="text-white/10">|</span>
            <span className="text-xs text-white/25 flex items-center gap-1">
              <Package className="h-3 w-3" />
              {user.buildCount} builds
            </span>
            <span className="text-xs text-white/25 flex items-center gap-1">
              <Award className="h-3 w-3" />
              Lvl {user.level}
            </span>
          </div>
        </div>

        {/* Manifesto quote — desktop */}
        {user.manifesto && (
          <div className="hidden xl:block max-w-md flex-shrink-0">
            <p className="text-[13px] text-white/30 italic leading-relaxed line-clamp-2">
              &ldquo;{user.manifesto}&rdquo;
            </p>
          </div>
        )}

        {/* Social links */}
        <div className="hidden md:flex items-center gap-1">
          {Object.entries(user.socialLinks)
            .slice(0, 4)
            .map(([platform, url]) => {
              const Icon = socialIcons[platform] || ExternalLink;
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white/25 hover:text-white/70 hover:bg-white/5 transition-colors"
                  title={platform}
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              );
            })}
        </div>

        {/* Owner: settings */}
        {isOwner && (
          <Link
            href="/settings/hangar"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/25 hover:text-white/70 hover:bg-white/5 border border-white/5 hover:border-white/15 transition-colors"
            title="Hangar settings"
          >
            <Settings className="h-4 w-4" />
          </Link>
        )}
      </div>
    </motion.div>
  );
}
