"use client";

import { SmartImage as Image } from "@/components/ui/smart-image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, MessageCircle, GitFork, Pin } from "lucide-react";
import { GradeBadge } from "@/components/ui/grade-badge";
import { VerificationBadge } from "@/components/ui/verification-badge";
import type { Build } from "@/lib/types";

interface BuildGridCardProps {
  build: Build;
  isPinned?: boolean;
}

export function BuildGridCard({ build, isPinned }: BuildGridCardProps) {
  const primaryImage = build.images.find((img) => img.isPrimary) || build.images[0];

  return (
    <div className="relative group" style={{ aspectRatio: "3/4" }}>
      <Link href={`/builds/${build.slug}`} className="absolute inset-0 rounded-[14px] overflow-hidden block">
        <motion.div
          layoutId={`build-${build.id}`}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="relative w-full h-full rounded-[14px] overflow-hidden border border-white/[0.08] bg-[#0d1420]"
          style={{
            boxShadow: isPinned
              ? "0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(220,38,38,0.3)"
              : "0 4px 24px rgba(0,0,0,0.6)",
          }}
        >
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt || build.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              style={primaryImage.objectPosition ? { objectPosition: primaryImage.objectPosition } : undefined}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/20 text-sm">No Image</div>
          )}

          {/* Grade badge */}
          <div className="absolute top-2.5 left-2.5 z-[5]">
            <GradeBadge grade={build.grade} />
          </div>

          {/* Pinned indicator */}
          {isPinned && (
            <div className="absolute top-2.5 left-2.5 mt-7 z-[6]">
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-gx-red/90 text-white">
                <Pin className="h-2.5 w-2.5" />
              </span>
            </div>
          )}

          {/* Verification */}
          {build.verification !== "unverified" && (
            <div className="absolute top-2.5 right-2.5 z-[5] p-1 rounded-full bg-black/50 backdrop-blur-sm">
              <VerificationBadge tier={build.verification} size="md" />
            </div>
          )}

          {/* WIP */}
          {build.status === "WIP" && (
            <div className="absolute top-9 right-2.5 z-[6]">
              <span className="px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-widest bg-amber-400/15 border border-amber-400/40 text-amber-400">WIP</span>
            </div>
          )}

          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/20 rounded-tl-[14px] z-[6]" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-white/20 rounded-tr-[14px] z-[6]" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-white/20 rounded-bl-[14px] z-[6]" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/20 rounded-br-[14px] z-[6]" />

          {/* Bottom gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none" />

          {/* Info panel */}
          <div className="absolute bottom-0 left-0 right-0 p-3 z-[5]">
            {build.techniques.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1.5">
                {build.techniques.slice(0, 2).map((tech) => (
                  <span key={tech} className="text-[9px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-white/10 text-white/55 border border-white/10">{tech}</span>
                ))}
                {build.techniques.length > 2 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/40">+{build.techniques.length - 2}</span>
                )}
              </div>
            )}

            <h3 className="text-[13px] font-bold text-white leading-tight truncate mb-0.5">{build.title}</h3>
            <p className="text-[10px] text-white/45 truncate mb-2">{build.kitName}</p>

            <div className="flex items-center gap-2.5 text-[11px] text-white/50">
              <span className="flex items-center gap-0.5"><Heart className="h-3 w-3" />{build.likes >= 1000 ? `${(build.likes / 1000).toFixed(1)}k` : build.likes}</span>
              <span className="flex items-center gap-0.5"><MessageCircle className="h-3 w-3" />{build.comments}</span>
              <span className="flex items-center gap-0.5"><GitFork className="h-3 w-3" />{build.forkCount}</span>
            </div>
          </div>
        </motion.div>
      </Link>
    </div>
  );
}
