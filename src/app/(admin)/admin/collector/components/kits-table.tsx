"use client";

import { useState, useTransition } from "react";
import { Trash2, Eye, EyeOff, Pencil } from "lucide-react";
import Link from "next/link";
import { SmartImage as Image } from "@/components/ui/smart-image";
import { adminDeleteKit, adminToggleKitActive } from "@/lib/actions/admin-collector";
import type { AdminGunplaKitUI } from "@/lib/types";

const categoryBadge: Record<string, string> = {
  BANDAI: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  THIRD_PARTY: "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

export function KitsTable({ kits }: { kits: AdminGunplaKitUI[] }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Kit
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Grade
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Series
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Active
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Owners
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {kits.map((kit) => (
              <KitRow key={kit.id} kit={kit} />
            ))}
            {kits.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  No kits found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KitRow({ kit }: { kit: AdminGunplaKitUI }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await adminDeleteKit(kit.id);
      setConfirming(false);
    });
  }

  function handleToggle() {
    startTransition(async () => {
      await adminToggleKitActive(kit.id);
    });
  }

  return (
    <tr className="hover:bg-muted/20 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {kit.imageUrl ? (
            <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-muted/30 shrink-0">
              <Image src={kit.imageUrl} alt={kit.name} fill className="object-contain" sizes="40px" />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-muted-foreground">{kit.grade}</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-foreground font-medium truncate max-w-[200px]">{kit.name}</p>
            {kit.modelNumber && (
              <p className="text-[10px] text-muted-foreground">{kit.modelNumber}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-gx-gold/10 text-gx-gold border border-gx-gold/20">
          {kit.grade}
        </span>
        {kit.scale && (
          <span className="ml-1 text-[10px] text-muted-foreground">{kit.scale}</span>
        )}
      </td>
      <td className="px-4 py-3 text-muted-foreground max-w-[150px] truncate">
        {kit.seriesName}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${categoryBadge[kit.category]}`}>
          {kit.category === "THIRD_PARTY" ? "3rd Party" : "Bandai"}
        </span>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={handleToggle}
          disabled={isPending}
          className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
          title={kit.isActive ? "Deactivate" : "Activate"}
        >
          {kit.isActive ? (
            <Eye className="h-4 w-4 text-green-400" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground/50" />
          )}
        </button>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {kit.totalOwners}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <Link
            href={`/admin/collector?tab=add&mode=edit&id=${kit.id}`}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-gx-gold hover:bg-gx-gold/10 transition-colors"
            title="Edit kit"
          >
            <Pencil className="h-4 w-4" />
          </Link>

          {confirming ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setConfirming(false)}
                disabled={isPending}
                className="px-2 py-1 rounded text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="px-2 py-1 rounded text-[10px] font-medium bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-colors disabled:opacity-50"
              >
                {isPending ? "..." : "Delete"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              title="Delete kit"
              className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/15 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
