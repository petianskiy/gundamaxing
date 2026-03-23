"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/context";

export function ConnectSection() {
  const { t } = useTranslation();

  const socials = [
    {
      name: "Instagram",
      handle: t("connect.igHandle"),
      href: "https://instagram.com/gundamaxing",
      icon: "/instagram-icon.webp",
      description: t("connect.igDesc"),
      cta: t("connect.igCta"),
      japLabel: "インスタグラム",
    },
    {
      name: "Discord",
      handle: t("connect.discordHandle"),
      href: "https://discord.gg/tf2nVVT8",
      icon: "/discord-icon.jpg",
      description: t("connect.discordDesc"),
      cta: t("connect.discordCta"),
      japLabel: "ディスコード",
    },
  ];

  return (
    <section className="relative py-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/connect-bg.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </div>
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        {/* Heading — single motion block, animates once */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55 }}
        >
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gx-red">
            接続 &middot; Connect
          </span>
          <h2 className="mt-3 text-4xl sm:text-5xl font-bold text-white tracking-tight">
            {t("connect.title")}
          </h2>
          <p className="mt-4 text-zinc-300 max-w-lg mx-auto text-base leading-relaxed">
            {t("connect.subtitle")}
          </p>
        </motion.div>

        {/* Social cards — CSS-only entrance, no motion per-card */}
        <div className="mt-12 grid sm:grid-cols-2 gap-6">
          {socials.map((social, i) => (
            <a
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex flex-col items-center gap-5 px-8 py-8 rounded-2xl border border-white/10 bg-black/40 hover:border-gx-red/50 hover:bg-black/60 transition-colors duration-200 overflow-hidden"
              style={{
                animationFillMode: "both",
                animation: `fadeSlideUp 0.5s ease ${0.25 + i * 0.12}s both`,
              }}
            >
              {/* Mecha corner accents */}
              <div className="absolute top-0 left-0 w-5 h-5 border-t border-l border-white/10 group-hover:border-gx-red/40 transition-colors duration-200" />
              <div className="absolute top-0 right-0 w-5 h-5 border-t border-r border-white/10 group-hover:border-gx-red/40 transition-colors duration-200" />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b border-l border-white/10 group-hover:border-gx-red/40 transition-colors duration-200" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b border-r border-white/10 group-hover:border-gx-red/40 transition-colors duration-200" />

              {/* Icon */}
              <div className="relative h-16 w-16 rounded-2xl overflow-hidden ring-1 ring-white/10 group-hover:ring-gx-red/40 transition-all duration-200">
                <Image
                  src={social.icon}
                  alt={social.name}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Text */}
              <div className="text-center">
                <p className="text-[10px] font-mono text-zinc-500 tracking-widest mb-1">
                  {social.japLabel}
                </p>
                <h3 className="text-lg font-bold text-white group-hover:text-gx-red transition-colors duration-200">
                  {social.name}
                </h3>
                <p className="text-sm text-zinc-300 mt-1 font-medium">{social.handle}</p>
                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{social.description}</p>
              </div>

              {/* CTA */}
              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gx-red/10 border border-gx-red/30 text-sm font-semibold text-gx-red group-hover:bg-gx-red group-hover:text-white transition-all duration-200">
                {social.cta}
                <svg className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </a>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
