"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LineageCard } from "@/components/lineage/lineage-card";
import { deleteLineage, toggleLineagePublic } from "@/lib/actions/lineage";
import type { LineageSummary } from "@/lib/types";

interface LineagesMineClientProps {
  lineages: LineageSummary[];
}

export function LineagesMineClient({ lineages }: LineagesMineClientProps) {
  const router = useRouter();

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Delete this lineage? This cannot be undone.")) return;
    const formData = new FormData();
    formData.set("id", id);
    const result = await deleteLineage(formData);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Lineage deleted");
      router.refresh();
    }
  }, [router]);

  const handleTogglePublic = useCallback(async (id: string) => {
    const formData = new FormData();
    formData.set("id", id);
    const result = await toggleLineagePublic(formData);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success(result.isPublic ? "Lineage is now public" : "Lineage is now private");
      router.refresh();
    }
  }, [router]);

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
