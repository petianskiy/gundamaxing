"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

export default function PrivacyPage() {
  const { t } = useTranslation();

  const sections = Array.from({ length: 6 }, (_, i) => ({
    title: t(`privacy.s${i + 1}.title`),
    content: t(`privacy.s${i + 1}.content`),
  }));

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-gx-red transition-colors mb-8"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("shared.backToHome")}
        </Link>

        <div className="mb-10">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gx-red">
            個人情報 &middot; Privacy
          </span>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            {t("privacy.pageTitle")}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("privacy.lastUpdated")}
          </p>
        </div>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
          {sections.map((section, i) => (
            <section
              key={i}
              className="rounded-xl border border-border/50 bg-card p-5 sm:p-6 space-y-4"
            >
              <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
              <p>{section.content}</p>
              {i === sections.length - 1 && (
                <p>
                  <a
                    href="https://discord.gg/tf2nVVT8"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gx-red hover:text-red-400 transition-colors"
                  >
                    Discord
                  </a>{" "}
                  &middot;{" "}
                  <a
                    href="https://instagram.com/gundamaxing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gx-red hover:text-red-400 transition-colors"
                  >
                    Instagram
                  </a>
                </p>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
