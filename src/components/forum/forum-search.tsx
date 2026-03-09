"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

export function ForumSearch({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();
  const { t } = useTranslation();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/forum/search?q=${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-600" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("forum.searchPlaceholder")}
          className="w-full pl-9 pr-3 py-2 rounded-l-lg border border-forum-border bg-forum-panel/80 text-xs text-gray-300 font-share-tech-mono placeholder:text-gray-600 focus:outline-none focus:border-gx-red/50 transition-colors"
        />
      </div>
      <button
        type="submit"
        className="px-3 py-2 rounded-r-lg bg-gx-red/15 border border-l-0 border-forum-border text-[10px] font-bold uppercase tracking-wider text-gx-red hover:bg-gx-red/25 transition-colors"
      >
        Scan
      </button>
    </form>
  );
}
