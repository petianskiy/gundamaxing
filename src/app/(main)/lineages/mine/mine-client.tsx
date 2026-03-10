"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LineageCard } from "@/components/lineage/lineage-card";
import { deleteLineage, toggleLineagePublic } from "@/lib/actions/lineage";
import { useTranslation } from "@/lib/i18n/context";
import type { LineageSummary } from "@/lib/types";

interface LineagesMineClientProps {
  lineages: LineageSummary[];
}

export function LineagesMineClient({ lineages }: LineagesMineClientProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm(t("lineage.action.deleteConfirm"))) return;
    const formData = new FormData();
    formData.set("id", id);
    const result = await deleteLineage(formData);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success(t("lineage.action.deleted"));
      router.refresh();
    }
  }, [router, t]);

  const handleTogglePublic = useCallback(async (id: string) => {
    const formData = new FormData();
    formData.set("id", id);
    const result = await toggleLineagePublic(formData);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success(result.isPublic ? t("lineage.action.toggledPublic") : t("lineage.action.toggledPrivate"));
      router.refresh();
    }
  }, [router, t]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {lineages.map((lineage) => (
        <LineageCard
          key={lineage.id}
          lineage={lineage}
          showActions
          onDelete={handleDelete}
          onTogglePublic={handleTogglePublic}
        />
      ))}
    </div>
  );
}
