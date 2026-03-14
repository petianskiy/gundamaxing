"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/context";
import { LOCALE_LABELS, type Locale } from "@/lib/i18n/index";
import { Globe, Check } from "lucide-react";

const LOCALES = Object.entries(LOCALE_LABELS) as [Locale, string][];

export function LanguageToggle() {
  const { locale, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 p-2 md:px-3 md:py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50"
        aria-label="Change language"
      >
        <Globe className="h-4 w-4 md:h-3.5 md:w-3.5" />
        <span className="hidden md:inline">{LOCALE_LABELS[locale]}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[140px] rounded-lg border border-border bg-card shadow-xl py-1">
          {LOCALES.map(([code, label]) => (
            <button
              key={code}
              onClick={() => {
                setLocale(code);
                setOpen(false);
              }}
              className="w-full flex items-center justify-between gap-3 px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
            >
              <span>{label}</span>
              {locale === code && <Check className="h-3.5 w-3.5 text-gx-red" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
