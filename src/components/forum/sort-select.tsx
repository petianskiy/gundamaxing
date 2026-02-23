"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

const SORT_OPTIONS = [
  { value: "newest", key: "forum.sortNewest" },
  { value: "most-replies", key: "forum.sortMostReplies" },
  { value: "most-views", key: "forum.sortMostViewed" },
] as const;

export function SortSelect({ current = "newest" }: { current?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", e.target.value);
    params.delete("page"); // reset to page 1 on sort change
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
      <select
        value={current}
        onChange={handleChange}
        className="bg-card border border-border/50 rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-gx-red/30"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {t(opt.key)}
          </option>
        ))}
      </select>
    </div>
  );
}
