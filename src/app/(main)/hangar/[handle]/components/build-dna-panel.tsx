"use client";

import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import type { Build } from "@/lib/types";

interface BuildDnaPanelProps {
  build: Build;
}

export function BuildDnaPanel({ build }: BuildDnaPanelProps) {
  const { t } = useTranslation();

  const hasBaseKit = !!build.baseKit;
  const hasInspiredBy = build.inspiredBy && build.inspiredBy.length > 0;
  const hasForks = build.forks && build.forks.length > 0;
  const hasIntent = !!build.intentStatement;

  // Don't render anything if there is no DNA data
  if (!hasBaseKit && !hasInspiredBy && !hasForks && !hasIntent) {
    return null;
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
        {t("hangar.inspect.buildDna")}
      </h3>

      <div
        className={cn(
          "bg-[#18181b] border border-[#27272a] rounded-xl",
          "divide-y divide-[#27272a]"
        )}
      >
        {/* Base Kit */}
        {hasBaseKit && (
          <div className="px-5 py-4">
            <dt className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
              {t("hangar.inspect.baseKit")}
            </dt>
            <dd className="text-sm text-zinc-200 mt-1">{build.baseKit}</dd>
          </div>
        )}

        {/* Inspired By */}
        {hasInspiredBy && (
          <div className="px-5 py-4">
            <dt className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
              {t("hangar.inspect.inspiredBy")}
            </dt>
            <dd className="mt-2 flex flex-wrap gap-2">
              {build.inspiredBy!.map((id) => (
                <span
                  key={id}
                  className={cn(
                    "inline-flex items-center px-2.5 py-1 rounded-md text-xs",
                    "bg-zinc-800 text-zinc-300 border border-[#27272a]"
                  )}
                >
                  {id}
                </span>
              ))}
            </dd>
          </div>
        )}

        {/* Forks */}
        {hasForks && (
          <div className="px-5 py-4">
            <dt className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
              {t("hangar.inspect.forks")}
            </dt>
            <dd className="text-sm text-zinc-200 mt-1">
              {build.forks!.length}
            </dd>
          </div>
        )}

        {/* Intent Statement */}
        {hasIntent && (
          <div className="px-5 py-4">
            <dt className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
              {t("hangar.inspect.intent")}
            </dt>
            <dd className="mt-2">
              <blockquote className="border-l-2 border-red-600/40 pl-3 text-sm text-zinc-300 italic leading-relaxed">
                {build.intentStatement}
              </blockquote>
            </dd>
          </div>
        )}
      </div>
    </div>
  );
}
