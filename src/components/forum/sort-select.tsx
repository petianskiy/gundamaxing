"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
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

  function handleClick(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex items-center gap-1">
      {SORT_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => handleClick(opt.value)}
          className={`px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${
            current === opt.value
              ? "bg-gx-red/15 text-red-400 border-gx-red/30"
              : "text-gray-500 hover:text-gray-300 border border-transparent"
          }`}
        >
          {t(opt.key)}
        </button>
      ))}
    </div>
  );
}
