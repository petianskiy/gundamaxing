"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

export default function GuidelinesPage() {
  const { t } = useTranslation();

  const sections = Array.from({ length: 8 }, (_, i) => ({
    title: t(`guidelines.s${i + 1}.title`),
    content: t(`guidelines.s${i + 1}.content`),
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
            規範 &middot; Guidelines
          </span>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            {t("guidelines.pageTitle")}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {t("guidelines.subtitle")}
          </p>
        </div>

        <div className="space-y-6">
          {sections.map((section, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-card p-5 sm:p-6"
            >
              <h2 className="text-base font-semibold text-foreground flex items-center gap-3">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-gx-red/10 text-gx-red text-xs font-bold">
                  {i + 1}
                </span>
                {section.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed ml-9">
                {section.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
