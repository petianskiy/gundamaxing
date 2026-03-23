"use client";

import { motion } from "framer-motion";
import { Monitor, Smartphone } from "lucide-react";
import { Safari } from "@/components/ui/safari";
import { Iphone } from "@/components/ui/iphone";

export function BuildDnaTeaser() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Monitor className="h-4 w-4 text-gx-red" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gx-red">
              対応済み &middot; Cross-Platform
            </span>
            <Smartphone className="h-4 w-4 text-gx-red" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Built for Every Screen
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Browse builds at your desk or upload straight from your phone. Fast, clean, and built to feel great on any screen.
          </p>
        </div>

        {/* Device mockups */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">

          {/* Safari desktop */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-3xl lg:flex-1"
          >
            <Safari
              url="gundamaxing.com"
              imageSrc="/images/safari-demo.png"
            />
          </motion.div>

          {/* iPhone */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
            className="w-full max-w-[200px] lg:max-w-[220px] shrink-0"
          >
            <Iphone videoSrc="/iphone-demo.mp4" />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
