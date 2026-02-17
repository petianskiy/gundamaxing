"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

export function SignInButton() {
  const { t } = useTranslation();

  return (
    <Link
      href="/login"
      className="flex h-8 w-8 items-center justify-center rounded-full border border-border/50 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
      title={t("auth.signIn")}
      aria-label={t("auth.signIn")}
    >
      <User className="h-4 w-4" />
    </Link>
  );
}
