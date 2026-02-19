"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Heart, MessageSquare, Pin, Trash2, Eye, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n/context";
import { pinBuild, unpinBuild } from "@/lib/actions/profile";
import { deleteBuild } from "@/lib/actions/settings";
import { cn } from "@/lib/utils";
import type { Build } from "@/lib/types";

interface BuildGridProps {
  builds: Build[];
  pinnedBuildIds: string[];
}

const statusColor: Record<string, string> = {
  WIP: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Completed: "bg-green-500/20 text-green-400 border-green-500/30",
  Abandoned: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

export function PortfolioBuildGrid({ builds, pinnedBuildIds: initialPinned }: BuildGridProps) {
  const { t } = useTranslation();
  const [pinnedIds, setPinnedIds] = useState<string[]>(initialPinned);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Build | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handlePin(buildId: string) {
    const isPinned = pinnedIds.includes(buildId);
    const result = isPinned ? await unpinBuild(buildId) : await pinBuild(buildId);

    if ("error" in result) {
      toast.error(result.error);
    } else {
      setPinnedIds((prev) =>
        isPinned ? prev.filter((id) => id !== buildId) : [...prev, buildId]
      );
      toast.success(isPinned ? t("portfolio.actions.unpin") : t("portfolio.actions.pin"));
    }
    setActiveMenu(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteBuild(deleteTarget.id);
    setDeleting(false);

    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success(t("portfolio.actions.delete"));
      window.location.reload();
    }
    setDeleteTarget(null);
  }

  // Sort pinned builds first
  const sortedBuilds = [...builds].sort((a, b) => {
    const aPin = pinnedIds.includes(a.id) ? -1 : 0;
    const bPin = pinnedIds.includes(b.id) ? -1 : 0;
    return aPin - bPin;
  });

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {sortedBuilds.map((build) => {
          const isPinned = pinnedIds.includes(build.id);
          const primaryImage = build.images.find((img) => img.isPrimary) || build.images[0];

          return (
            <div
              key={build.id}
              className={cn(
                "group relative rounded-xl border bg-card overflow-hidden transition-colors",
                isPinned ? "border-gx-red/30" : "border-border/50 hover:border-border"
              )}
            >
              {/* Pinned badge */}
              {isPinned && (
                <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-gx-red/90 text-white text-[10px] font-medium">
                  <Pin className="h-2.5 w-2.5" />
                  {t("portfolio.pinned")}
                </div>
              )}

              {/* Action menu */}
              <div className="absolute top-2 right-2 z-10">
                <button
                  onClick={() => setActiveMenu(activeMenu === build.id ? null : build.id)}
                  className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white/70 hover:text-white transition-colors"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {activeMenu === build.id && (
                  <div className="absolute right-0 mt-1 w-40 rounded-lg border border-border/50 bg-card shadow-xl overflow-hidden">
                    <Link
                      href={`/builds/${build.slug}`}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      onClick={() => setActiveMenu(null)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {t("portfolio.actions.view")}
                    </Link>
                    <button
                      onClick={() => handlePin(build.id)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    >
                      <Pin className="h-3.5 w-3.5" />
                      {isPinned ? t("portfolio.actions.unpin") : t("portfolio.actions.pin")}
                    </button>
                    <button
                      onClick={() => {
                        setDeleteTarget(build);
                        setActiveMenu(null);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t("portfolio.actions.delete")}
                    </button>
                  </div>
                )}
              </div>

              {/* Image */}
              <Link href={`/builds/${build.slug}`}>
                <div className="relative aspect-[4/3] bg-muted">
                  {primaryImage ? (
                    <Image
                      src={primaryImage.url}
                      alt={primaryImage.alt || build.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-[1.02]"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
              </Link>

              {/* Info */}
              <div className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {build.title}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {build.kitName} &middot; {build.grade} &middot; {build.scale}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium border",
                      statusColor[build.status] || ""
                    )}
                  >
                    {build.status}
                  </span>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {build.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {build.comments}
                  </span>
                  <span className="ml-auto text-[10px]">{build.createdAt}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t("portfolio.actions.delete")}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("portfolio.deleteConfirm")}
          </p>
          {deleteTarget && (
            <p className="text-sm font-medium text-foreground">
              &quot;{deleteTarget.title}&quot;
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
