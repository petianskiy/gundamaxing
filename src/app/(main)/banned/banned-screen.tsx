"use client";

import { ShieldOff, ExternalLink, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

interface BannedScreenProps {
  reason: string;
  bannedAt: string | null;
}

export function BannedScreen({ reason, bannedAt }: BannedScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      {/* Animated background noise */}
      <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />

      <div className="relative max-w-lg mx-auto px-6 text-center">
        {/* Ban icon */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
              <ShieldOff className="h-10 w-10 text-red-500" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="font-orbitron text-2xl sm:text-3xl font-bold text-red-500 uppercase tracking-wider mb-2">
          Account Suspended
        </h1>
        <div className="w-16 h-0.5 bg-red-500/50 mx-auto mb-6" />

        {/* Reason */}
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-6 py-4 mb-6">
          <p className="text-sm text-red-300/80 leading-relaxed">{reason}</p>
          {bannedAt && (
            <p className="text-[11px] text-red-400/40 mt-2 font-share-tech-mono">
              Suspended on {new Date(bannedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
        </div>

        {/* Punishment link */}
        <p className="text-xs text-white/30 mb-4">
          While you reflect on your actions, enjoy this:
        </p>
        <a
          href="https://www.youtube.com/watch?v=CaBEdunlaOU&list=RDCaBEdunlaOU&start_radio=1"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/25 hover:border-red-500/50 transition-all group"
        >
          <ExternalLink className="h-4 w-4 group-hover:scale-110 transition-transform" />
          Your Punishment Awaits
        </a>

        {/* Sign out */}
        <div className="mt-8">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="inline-flex items-center gap-1.5 text-xs text-white/20 hover:text-white/40 transition-colors"
          >
            <LogOut className="h-3 w-3" />
            Sign out
          </button>
        </div>

        <p className="text-[10px] text-white/10 mt-6">
          If you believe this is a mistake, contact support.
        </p>
      </div>
    </div>
  );
}
