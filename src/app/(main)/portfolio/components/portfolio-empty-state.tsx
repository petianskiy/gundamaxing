"use client";

import Link from "next/link";
import { Upload, Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";

export function PortfolioEmptyState() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gx-red/10 flex items-center justify-center mb-6">
        <Hammer className="h-10 w-10 text-gx-red/60" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">
        {t("portfolio.empty.title")}
      </h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        {t("portfolio.empty.subtitle")}
      </p>
      <Link href="/upload">
        <Button variant="primary">
          <Upload className="h-4 w-4 mr-2" />
          {t("portfolio.empty.cta")}
        </Button>
      </Link>
    </div>
  );
}
