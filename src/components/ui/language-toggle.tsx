"use client";

import { useTranslation } from "@/lib/i18n/context";
import { Globe } from "lucide-react";

export function LanguageToggle() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <button
      onClick={() => setLocale(locale === "en" ? "ja" : "en")}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50"
      aria-label={locale === "en" ? "Switch to Japanese" : "Switch to English"}
    >
      <Globe className="h-3.5 w-3.5" />
      <span>{t("lang.toggle")}</span>
    </button>
  );
}
