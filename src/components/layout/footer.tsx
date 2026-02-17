"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n/context";

export function Footer() {
  const { t } = useTranslation();

  const footerSections = [
    {
      title: t("footer.platform"),
      links: [
        { label: t("footer.builds"), href: "/builds" },
        { label: t("footer.forum"), href: "/forum" },
        { label: t("footer.upload"), href: "/upload" },
      ],
    },
    {
      title: t("footer.community"),
      links: [
        { label: t("footer.guidelines"), href: "/guidelines" },
        { label: t("footer.faq"), href: "/faq" },
      ],
    },
    {
      title: t("footer.legal"),
      links: [
        { label: t("footer.privacy"), href: "/privacy" },
        { label: t("footer.terms"), href: "/terms" },
      ],
    },
  ];

  return (
    <footer className="border-t border-border/50 bg-gx-surface relative overflow-hidden safe-bottom">
      {/* Decorative HUD lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gx-red/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <Image
                src="/gundam-emoji.png"
                alt="Gundam"
                width={28}
                height={28}
                className="h-7 w-7 object-contain opacity-60"
              />
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-[0.2em] text-foreground">
                  GUNDAMAXING
                </span>
                <span className="h-[2px] w-16 bg-gx-red mt-1" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground/50 font-mono tracking-widest">
              ガンダマクシング
            </p>
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
              {t("footer.tagline")}
            </p>
          </div>

          {/* Link sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-gx-red transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Gundam-themed divider */}
        <div className="mt-12 pt-6 border-t border-border/50 relative">
          <div className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-px bg-gx-red" />
          <p className="text-xs text-muted-foreground/60 text-center leading-relaxed">
            {t("footer.disclaimer")}
          </p>
          <p className="text-xs text-muted-foreground/40 text-center mt-2">
            &copy; {new Date().getFullYear()} Gundamaxing
          </p>
          <p className="text-[10px] text-muted-foreground/20 text-center mt-1 font-mono tracking-[0.3em]">
            {t("footer.motto")}
          </p>
        </div>
      </div>
    </footer>
  );
}
