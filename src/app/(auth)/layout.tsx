"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12">
        {/* Background image */}
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/login-bg.jpg')" }}
        />
        <div className="fixed inset-0 bg-black/65" />

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
        <div className="w-full max-w-lg relative z-10">{children}</div>
      </main>
      <Footer />
    </>
  );
}
