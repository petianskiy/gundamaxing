"use client";

import { useTranslation } from "@/lib/i18n/context";

export function ForumHero() {
  const { t } = useTranslation();

  return (
    <div className="relative overflow-hidden rounded-xl border border-forum-border bg-forum-panel mb-8">
      <div className="forum-hex-pattern" />
      <div className="relative px-6 py-10 sm:px-10 sm:py-14 text-center">
        <p className="font-share-tech-mono text-[11px] uppercase tracking-[0.3em] text-forum-accent mb-3">
          // PILOT COMMS NETWORK
        </p>
        <h1 className="font-orbitron text-3xl sm:text-4xl font-bold text-white tracking-wide">
          {t("forum.title")}
        </h1>
        <p className="mt-3 text-sm text-gray-400 max-w-md mx-auto font-rajdhani">
          {t("forum.subtitle")}
        </p>
        {/* Accent line */}
        <div className="mt-6 mx-auto w-20 h-0.5 bg-gradient-to-r from-transparent via-forum-accent to-transparent" />
      </div>
    </div>
  );
}
