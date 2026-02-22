"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

export function DeleteConfirmButton({
  action,
  itemType,
}: {
  action: () => Promise<void>;
  itemType: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await action();
      setConfirming(false);
    });
  }

  if (confirming) {
    return (
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
          {isPending ? "Deleting..." : "Delete"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      title={`Delete ${itemType}`}
      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/15 transition-colors"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
