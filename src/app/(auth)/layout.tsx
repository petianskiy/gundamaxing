"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background grid effect */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--border)) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Decorative scan line */}
      <div className="fixed top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gx-red/40 to-transparent" />
      <div className="fixed bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gx-red/40 to-transparent" />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 relative z-10"
      >
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/gundam-emoji.png"
            alt="Gundam"
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
          />
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-[0.2em] text-foreground">
              GUNDAMAXING
            </span>
            <span className="h-[2px] w-full bg-gx-red" />
            <span className="text-[8px] text-muted-foreground/40 tracking-[0.3em] font-mono mt-0.5">
              ガンダマクシング
            </span>
          </div>
        </Link>
      </motion.div>

      {/* Content */}
      <div className="w-full max-w-md relative z-10">{children}</div>

      {/* Corner accents */}
      <div className="fixed top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-gx-red/20" />
      <div className="fixed top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-gx-red/20" />
      <div className="fixed bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-gx-red/20" />
      <div className="fixed bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-gx-red/20" />
    </div>
  );
}
