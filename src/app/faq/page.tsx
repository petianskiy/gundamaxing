"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

export default function FAQPage() {
  const { t } = useTranslation();

  const faqs = Array.from({ length: 9 }, (_, i) => ({
    q: t(`faq.q${i + 1}`),
    a: t(`faq.a${i + 1}`),
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
            質問 &middot; FAQ
          </span>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            {t("faq.pageTitle")}
          </h1>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-card p-5 sm:p-6"
            >
              <h2 className="text-base font-semibold text-foreground">
                {faq.q}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
