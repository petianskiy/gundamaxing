"use client";

import { motion } from "framer-motion";
import { Iphone } from "@/components/ui/iphone";
import { useTranslation } from "@/lib/i18n/context";

const APP_STORE_URL =
  "https://apps.apple.com/at/app/gundam-card-game-teaching-app/id6745876331?l=en-GB";

function AppleStoreBadge({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-black border border-white/10 hover:border-white/25 hover:bg-zinc-900 transition-all duration-200"
      aria-label="Download on the App Store"
    >
      <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
      <div className="text-left">
        <div className="text-[10px] text-zinc-400 leading-none mb-0.5">Download on the</div>
        <div className="text-[17px] font-semibold text-white leading-none tracking-tight">App Store</div>
      </div>
    </a>
  );
}

export function AppDownload() {
  const { t } = useTranslation();

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── Left: text + badge ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55 }}
          >
            <div className="mb-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-400">
                {t("cards.app.eyebrow")}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
              {t("cards.app.title")}
            </h2>
            <p className="mt-4 text-zinc-400 leading-relaxed max-w-md">
              {t("cards.app.subtitle")}
            </p>
            <ul className="mt-6 space-y-2">
              {(["cards.app.feature1", "cards.app.feature2", "cards.app.feature3"] as const).map((key) => (
                <li key={key} className="flex items-center gap-2 text-sm text-zinc-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                  {t(key)}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <AppleStoreBadge href={APP_STORE_URL} />
            </div>
          </motion.div>

          {/* ── Right: two iPhones, clearly separated ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="relative flex items-center justify-center gap-6"
            style={{ minHeight: 360 }}
          >
            {/* Portrait iPhone — left */}
            <div className="relative z-10 flex-shrink-0 w-[140px] sm:w-[160px]">
              <Iphone src="/images/cards/vertical-iphone.jpg" />
            </div>

            {/* Landscape iPhone — right, rotated */}
            <div
              className="relative z-10 flex-shrink-0 w-[140px] sm:w-[160px]"
              style={{ transform: "rotate(90deg)" }}
            >
              <Iphone src="/images/cards/horizontal-iphone.jpg" />
            </div>

            {/* Background glow */}
            <div className="absolute inset-0 bg-indigo-500/[0.04] rounded-full blur-[80px] pointer-events-none" />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
