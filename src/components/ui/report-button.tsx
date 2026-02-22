"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Flag } from "lucide-react";
import { Dialog } from "./dialog";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { submitReport } from "@/lib/actions/report";

interface ReportButtonProps {
  targetType: "build" | "comment" | "thread" | "user";
  targetId: string;
  ownerId?: string;
  className?: string;
}

const REASONS = [
  { value: "SPAM", label: "Spam" },
  { value: "HARASSMENT", label: "Harassment" },
  { value: "INAPPROPRIATE", label: "Inappropriate content" },
  { value: "MISINFORMATION", label: "Misinformation" },
  { value: "OTHER", label: "Other" },
] as const;

export function ReportButton({ targetType, targetId, ownerId, className }: ReportButtonProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session?.user) {
    return (
      <button
        onClick={() => window.location.href = "/login"}
        className={className || "flex items-center gap-1 text-xs text-muted-foreground hover:text-red-400 transition-colors"}
      >
        <Flag className="h-3 w-3" />
        Report
      </button>
    );
  }

  if (ownerId && session.user.id === ownerId) return null;

  async function handleSubmit() {
    if (!reason) return;
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.set("reason", reason);
    formData.set("description", description);
    formData.set("targetType", targetType);
    formData.set("targetId", targetId);
    const result = await submitReport(formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setSubmitted(true);
    setTimeout(() => {
      setOpen(false);
      setSubmitted(false);
      setReason("");
      setDescription("");
      setError(null);
    }, 1500);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={className || "flex items-center gap-1 text-xs text-muted-foreground hover:text-red-400 transition-colors"}
      >
        <Flag className="h-3 w-3" />
        Report
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Report Content">
        {submitted ? (
          <div className="text-center py-4">
            <p className="text-sm text-foreground">Report submitted. Thank you.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
            )}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Reason
              </label>
              <div className="grid grid-cols-2 gap-2">
                {REASONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                      reason === r.value
                        ? "border-gx-red/50 bg-gx-red/10 text-gx-red"
                        : "border-border/50 text-muted-foreground hover:border-border"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              label="Details (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide additional context..."
              rows={3}
            />

            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleSubmit} loading={loading} disabled={!reason}>
                Submit Report
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
