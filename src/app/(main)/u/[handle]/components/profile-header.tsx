"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Star,
  Award,
  Calendar,
  Heart,
  Package,
  Pencil,
  Globe,
  Twitter,
  Youtube,
  Instagram,
  ExternalLink,
} from "lucide-react";
import { VerificationBadge } from "@/components/ui/verification-badge";

interface ProfileUser {
  handle: string;
  displayName: string | null;
  username: string;
  avatar: string | null;
  banner: string | null;
  bio: string | null;
  accentColor: string | null;
  verificationTier: string;
  level: number;
  reputation: number;
  socialLinks: Record<string, string>;
  buildCount: number;
  likeCount: number;
  joinedAt: string;
}

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

export function ProfileHeader({
  user,
  isOwner,
}: {
  user: ProfileUser;
  isOwner: boolean;
}) {
  const accentColor = user.accentColor || "#dc2626";

  return (
    <section className="rounded-xl border border-border/50 bg-card overflow-hidden">
      {/* Banner */}
      <div className="relative h-48 w-full bg-gradient-to-br from-gx-surface via-gx-surface-elevated to-gx-surface">
        {user.banner ? (
          <Image
            src={user.banner}
            alt={`${user.displayName || user.username}'s banner`}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `linear-gradient(135deg, ${accentColor}33, transparent 70%)`,
            }}
          />
        )}
        {/* Mecha hex pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "repeating-linear-gradient(60deg, transparent, transparent 10px, currentColor 10px, currentColor 11px)",
        }} />
      </div>

      {/* Profile content */}
      <div className="px-6 pb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Avatar - overlapping banner */}
          <div className="-mt-12 relative z-10">
            <div
              className={cn(
                "h-24 w-24 rounded-full ring-4 ring-offset-4 ring-offset-card overflow-hidden bg-muted",
                tierRingColor[user.verificationTier] || "ring-zinc-600"
              )}
            >
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.displayName || user.username}
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-3xl font-bold text-muted-foreground bg-gx-surface">
                  {(user.displayName || user.username)[0]?.toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 pt-2 sm:pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                {user.displayName || user.username}
              </h1>
              <VerificationBadge
                tier={user.verificationTier.toLowerCase() as any}
                showLabel
                size="md"
              />
              {isOwner && (
                <Link
                  href="/settings/profile"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-muted/50 text-muted-foreground hover:text-foreground border border-border/50 hover:border-border transition-colors ml-auto"
                >
                  <Pencil className="h-3 w-3" />
                  Edit Profile
                </Link>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              @{user.handle}
            </p>

            {user.bio && (
              <p className="text-sm text-zinc-300 mt-3 leading-relaxed max-w-xl">
                {user.bio}
              </p>
            )}

            {/* Social Links */}
            {Object.keys(user.socialLinks).length > 0 && (
              <div className="flex gap-2 mt-3">
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

            {/* Stats row */}
            <div className="flex flex-wrap gap-6 mt-5 pt-4 border-t border-border/50 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Package className="h-3.5 w-3.5" />
                <span className="font-semibold text-foreground">
                  {user.buildCount}
                </span>{" "}
                Builds
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Heart className="h-3.5 w-3.5" />
                <span className="font-semibold text-foreground">
                  {user.likeCount.toLocaleString()}
                </span>{" "}
                Likes
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Star className="h-3.5 w-3.5" />
                <span className="font-semibold text-foreground">
                  Lv. {user.level}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Award className="h-3.5 w-3.5" />
                <span className="font-semibold text-foreground">
                  {user.reputation.toLocaleString()}
                </span>{" "}
                Rep
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Joined {user.joinedAt}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
