"use client";

import { useState, useTransition } from "react";
import { SmartImage as Image } from "@/components/ui/smart-image";
import { Trophy, Trash2, Eye, X, Film } from "lucide-react";
import { selectMissionWinner, clearMissionWinner, adminDeleteSubmission } from "@/lib/actions/admin-missions";
import type { AdminMissionSubmissionUI } from "@/lib/types";

interface Props {
  submissions: AdminMissionSubmissionUI[];
  missionId: string;
  winnerId: string | null;
}

export function MissionSubmissionsTable({ submissions, missionId, winnerId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleSelectWinner = (submissionId: string) => {
    startTransition(async () => {
      await selectMissionWinner(submissionId);
    });
  };

  const handleClearWinner = () => {
    startTransition(async () => {
      await clearMissionWinner(missionId);
    });
  };

  const handleDelete = (submissionId: string) => {
    startTransition(async () => {
      await adminDeleteSubmission(submissionId);
      setConfirmDeleteId(null);
    });
  };

  if (submissions.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
        <p className="text-muted-foreground">No submissions yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">
          {submissions.length} Submissions
        </h3>
        {winnerId && (
          <button
            type="button"
            disabled={isPending}
            onClick={handleClearWinner}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors disabled:opacity-50"
          >
            Clear Winner
          </button>
        )}
      </div>

      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-12" />
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Submission
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Author
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Media
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {submissions.map((sub) => {
                const isWinner = sub.id === winnerId;
                const isExpanded = expandedId === sub.id;
                const isDeleting = confirmDeleteId === sub.id;

                return (
                  <tr
                    key={sub.id}
                    className={`hover:bg-muted/20 transition-colors ${
                      isWinner ? "bg-gx-gold/5" : ""
                    }`}
                  >
                    {/* Thumbnail */}
                    <td className="px-4 py-3">
                      {sub.images[0] ? (
                        <div className="relative w-10 h-10 rounded overflow-hidden border border-border/50">
                          <Image
                            src={sub.images[0]}
                            alt=""
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted/30" />
                      )}
                    </td>

                    {/* Title */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground truncate max-w-[200px]">
                          {sub.title}
                        </span>
                        {isWinner && (
                          <Trophy className="h-3.5 w-3.5 text-gx-gold shrink-0" />
                        )}
                      </div>
                    </td>

                    {/* Author */}
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-foreground text-xs">{sub.username}</p>
                        <p className="text-muted-foreground text-[10px]">{sub.userEmail}</p>
                      </div>
                    </td>

                    {/* Media */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{sub.images.length} imgs</span>
                        {sub.videoUrl && (
                          <span className="flex items-center gap-1 text-gx-gold/70">
                            <Film className="h-3 w-3" />
                            video
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <div>{new Date(sub.createdAt).toLocaleDateString()}</div>
                      {sub.updatedAt !== sub.createdAt && (
                        <div className="text-[10px] text-muted-foreground/60">
                          edited {new Date(sub.updatedAt).toLocaleDateString()}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* View */}
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                          title="View details"
                        >
                          {isExpanded ? <X className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>

                        {/* Winner toggle */}
                        {!isWinner ? (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleSelectWinner(sub.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-gx-gold hover:bg-gx-gold/10 transition-colors disabled:opacity-50"
                            title="Select as winner"
                          >
                            <Trophy className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-gx-gold/15 text-gx-gold border border-gx-gold/30">
                            Winner
                          </span>
                        )}

                        {/* Delete */}
                        {isDeleting ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 rounded text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleDelete(sub.id)}
                              className="px-2 py-1 rounded text-xs text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(sub.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete submission"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="mt-3 p-4 rounded-lg bg-muted/20 border border-border/30 text-left">
                          <p className="text-xs text-muted-foreground mb-3 whitespace-pre-line">
                            {sub.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {sub.images.map((img) => (
                              <div
                                key={img}
                                className="relative w-20 h-20 rounded overflow-hidden border border-border/50"
                              >
                                <Image
                                  src={img}
                                  alt=""
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ))}
                          </div>
                          {sub.videoUrl && (
                            <div className="mt-2">
                              <video
                                src={sub.videoUrl}
                                controls
                                className="max-h-48 rounded border border-border/50"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
