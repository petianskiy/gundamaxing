"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/lib/i18n/context";
import { SortSelect } from "@/components/forum/sort-select";
import { ForumSearch } from "@/components/forum/forum-search";

export function ForumThreadControls({ sort }: { sort: string }) {
  const { data: session } = useSession();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-3">
        {session?.user && (
          <Link
            href="/forum/new"
            className="clip-angle inline-flex items-center gap-1.5 px-4 py-2 bg-forum-accent text-black text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("forum.newThread")}
          </Link>
        )}
        <SortSelect current={sort} />
      </div>
      <div className="w-full sm:w-56">
        <ForumSearch />
      </div>
    </div>
  );
}
