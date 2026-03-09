"use client";

import { MessageSquare } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

export function ForumHero() {
  const { t } = useTranslation();

  return (
    <div className="text-center mb-10">
      <div className="flex items-center justify-center gap-2 mb-3">
        <MessageSquare className="h-5 w-5 text-gx-red" />
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gx-red">
          討論 · Pilot Comms
        </span>
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
        {t("forum.title")}
      </h1>
      <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
        {t("forum.subtitle")}
      </p>
    </div>
  );
}
