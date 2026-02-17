"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/context";
import "./laser-flow.css";

const LaserFlow = dynamic(
  () => import("./laser-flow").then((mod) => mod.LaserFlow),
  { ssr: false }
);

export function ConnectSection() {
  const { t } = useTranslation();

  const socials = [
    {
      name: "Instagram",
      handle: t("connect.igHandle"),
      href: "https://instagram.com/gundamaxing",
      icon: "/instagram-icon.png",
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
      {/* LaserFlow background */}
      <div className="absolute inset-0" style={{ pointerEvents: "auto" }}>
        <LaserFlow
          color="#a8c6fe"
          wispDensity={1}
          flowSpeed={0.35}
          verticalSizing={2}
          horizontalSizing={0.5}
          fogIntensity={0.45}
          fogScale={0.3}
          wispSpeed={15}
          wispIntensity={5}
          flowStrength={0.25}
          decay={1.1}
          horizontalBeamOffset={0}
          verticalBeamOffset={-0.5}
        />
      </div>

      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content overlay */}
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
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

        <div className="mt-12 grid sm:grid-cols-2 gap-6">
          {socials.map((social, i) => (
            <motion.a
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
              className="group relative flex flex-col items-center gap-5 px-8 py-8 rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl hover:border-gx-red/50 transition-all overflow-hidden"
            >
              {/* Mecha corner accents */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white/10 group-hover:border-gx-red/50 transition-colors" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white/10 group-hover:border-gx-red/50 transition-colors" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white/10 group-hover:border-gx-red/50 transition-colors" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white/10 group-hover:border-gx-red/50 transition-colors" />

              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gx-red/5 opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Icon */}
              <div className="relative h-16 w-16 rounded-2xl overflow-hidden ring-2 ring-white/10 group-hover:ring-gx-red/40 transition-all">
                <Image
                  src={social.icon}
                  alt={social.name}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              </div>

              {/* Text */}
              <div className="relative text-center">
                <p className="text-[10px] font-mono text-zinc-500 tracking-widest mb-1">
                  {social.japLabel}
                </p>
                <h3 className="text-lg font-bold text-white group-hover:text-gx-red transition-colors">
                  {social.name}
                </h3>
                <p className="text-sm text-zinc-300 mt-1 font-medium">
                  {social.handle}
                </p>
                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                  {social.description}
                </p>
              </div>

              {/* CTA button */}
              <span className="relative inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gx-red/10 border border-gx-red/30 text-sm font-semibold text-gx-red group-hover:bg-gx-red group-hover:text-white transition-all">
                {social.cta}
                <svg
                  className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </motion.a>
          ))}
        </div>

      </div>
    </section>
  );
}
