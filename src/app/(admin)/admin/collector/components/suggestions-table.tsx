"use client";

import { useState, useTransition } from "react";
import { Check, X, MessageSquare } from "lucide-react";
import { SmartImage as Image } from "@/components/ui/smart-image";
import { adminUpdateSuggestion } from "@/lib/actions/admin-collector";
import type { KitSuggestionUI } from "@/lib/types";

const statusBadge: Record<string, string> = {
  PENDING: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  APPROVED: "bg-green-500/15 text-green-400 border-green-500/30",
  REJECTED: "bg-red-500/15 text-red-400 border-red-500/30",
};

export function SuggestionsTable({ suggestions }: { suggestions: KitSuggestionUI[] }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Kit Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Series
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Grade
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Manufacturer
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {suggestions.map((s) => (
              <SuggestionRow key={s.id} suggestion={s} />
            ))}
            {suggestions.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                  No suggestions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SuggestionRow({ suggestion }: { suggestion: KitSuggestionUI }) {
  const [isPending, startTransition] = useTransition();
  const [showNotes, setShowNotes] = useState(false);
  const [adminNotes, setAdminNotes] = useState(suggestion.adminNotes ?? "");

  function handleAction(status: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      await adminUpdateSuggestion({
        id: suggestion.id,
        status,
        adminNotes: adminNotes.trim() || null,
      });
      setShowNotes(false);
    });
  }

  return (
    <>
      <tr className="hover:bg-muted/20 transition-colors">
        <td className="px-4 py-3">
          <div>
            <p className="text-foreground font-medium">{suggestion.kitName}</p>
            {suggestion.notes && (
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[200px]">
                &quot;{suggestion.notes}&quot;
              </p>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-muted-foreground max-w-[120px] truncate">
          {suggestion.seriesName}
        </td>
        <td className="px-4 py-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-gx-gold/10 text-gx-gold border border-gx-gold/20">
            {suggestion.grade}
          </span>
          {suggestion.scale && (
            <span className="ml-1 text-[10px] text-muted-foreground">{suggestion.scale}</span>
          )}
        </td>
        <td className="px-4 py-3 text-muted-foreground">
          {suggestion.manufacturer}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {suggestion.userAvatar && (
              <div className="relative h-5 w-5 rounded-full overflow-hidden shrink-0">
                <Image src={suggestion.userAvatar} alt="" fill className="object-cover" sizes="20px" />
              </div>
            )}
            <span className="text-muted-foreground text-xs">{suggestion.username}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${statusBadge[suggestion.status]}`}>
            {suggestion.status}
          </span>
        </td>
        <td className="px-4 py-3 text-muted-foreground text-xs">
          {suggestion.createdAt}
        </td>
        <td className="px-4 py-3">
          {suggestion.status === "PENDING" ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleAction("APPROVED")}
                disabled={isPending}
                title="Approve"
                className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/15 transition-colors disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleAction("REJECTED")}
                disabled={isPending}
                title="Reject"
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/15 transition-colors disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowNotes(!showNotes)}
                title="Add notes"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <span className="text-[10px] text-muted-foreground">
              {suggestion.adminNotes || "—"}
            </span>
          )}
        </td>
      </tr>
      {showNotes && (
        <tr>
          <td colSpan={8} className="px-4 py-3 bg-muted/10">
            <div className="flex items-start gap-3 max-w-lg">
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add admin notes (optional)..."
                rows={2}
                className="flex-1 px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gx-gold/50 resize-none"
              />
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleAction("APPROVED")}
                  disabled={isPending}
                  className="px-3 py-1.5 rounded text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25 transition-colors disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleAction("REJECTED")}
                  disabled={isPending}
                  className="px-3 py-1.5 rounded text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
