"use client";

import { useState, useTransition } from "react";
import { X, Send, Loader2, CheckCircle } from "lucide-react";
import { submitKitSuggestion } from "@/lib/actions/kit-suggestion";

const GRADES = ["HG", "RG", "MG", "PG", "SD", "RE/100", "FM", "EG", "MGEX", "HiRM"];
const SCALES = ["1/144", "1/100", "1/60", "Non-scale"];

interface SuggestKitModalProps {
  open: boolean;
  onClose: () => void;
  seriesList: string[];
}

export function SuggestKitModal({ open, onClose, seriesList }: SuggestKitModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [kitName, setKitName] = useState("");
  const [seriesName, setSeriesName] = useState("");
  const [customSeries, setCustomSeries] = useState("");
  const [grade, setGrade] = useState("");
  const [scale, setScale] = useState("");
  const [manufacturer, setManufacturer] = useState("Bandai");
  const [notes, setNotes] = useState("");

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const finalSeries = seriesName === "__custom" ? customSeries.trim() : seriesName;
    if (!finalSeries) {
      setError("Please select or enter a series name.");
      return;
    }

    startTransition(async () => {
      const result = await submitKitSuggestion({
        kitName: kitName.trim(),
        seriesName: finalSeries,
        grade,
        scale: scale || null,
        manufacturer: manufacturer.trim() || "Bandai",
        notes: notes.trim() || null,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  }

  function handleClose() {
    setKitName("");
    setSeriesName("");
    setCustomSeries("");
    setGrade("");
    setScale("");
    setManufacturer("Bandai");
    setNotes("");
    setError(null);
    setSuccess(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl border border-border/50 bg-gx-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div>
            <h2 className="text-lg font-bold text-foreground font-rajdhani">
              Suggest a Kit
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Don&apos;t see your kit here? Let us know what to add!
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {success ? (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-400 mb-4" />
              <p className="text-foreground font-medium mb-1">Suggestion Submitted!</p>
              <p className="text-sm text-muted-foreground mb-6">
                Thank you! We&apos;ll review your suggestion and add it to the catalog if possible.
              </p>
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-lg bg-gx-red/15 text-gx-red text-sm font-medium border border-gx-red/30 hover:bg-gx-red/25 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Kit Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={kitName}
                  onChange={(e) => setKitName(e.target.value)}
                  required
                  placeholder="e.g. Aerial Rebuild, Hi-Nu Gundam Ver.Ka"
                  className="w-full px-3 py-2.5 rounded-lg border border-border/50 bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gx-red/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Series <span className="text-red-400">*</span>
                </label>
                <select
                  value={seriesName}
                  onChange={(e) => setSeriesName(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-border/50 bg-muted/30 text-sm text-foreground focus:outline-none focus:border-gx-red/50"
                >
                  <option value="">Select a series...</option>
                  {seriesList.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value="__custom">Other (type below)...</option>
                </select>
                {seriesName === "__custom" && (
                  <input
                    type="text"
                    value={customSeries}
                    onChange={(e) => setCustomSeries(e.target.value)}
                    placeholder="Enter series name"
                    className="w-full mt-2 px-3 py-2.5 rounded-lg border border-border/50 bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gx-red/50"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Grade <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-border/50 bg-muted/30 text-sm text-foreground focus:outline-none focus:border-gx-red/50"
                  >
                    <option value="">Select grade...</option>
                    {GRADES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Scale
                  </label>
                  <select
                    value={scale}
                    onChange={(e) => setScale(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-border/50 bg-muted/30 text-sm text-foreground focus:outline-none focus:border-gx-red/50"
                  >
                    <option value="">Select scale...</option>
                    {SCALES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Manufacturer / Brand
                </label>
                <input
                  type="text"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  placeholder="Bandai, Daban, SuperNova, etc."
                  className="w-full px-3 py-2.5 rounded-lg border border-border/50 bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gx-red/50"
                />
                <p className="mt-1 text-[10px] text-muted-foreground/60">
                  For 3rd party kits, enter the brand name (e.g. Daban, SuperNova, MG Hobby)
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="Any additional details, links, or context..."
                  className="w-full px-3 py-2.5 rounded-lg border border-border/50 bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gx-red/50 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gx-red/15 text-gx-red text-sm font-medium border border-gx-red/30 hover:bg-gx-red/25 transition-colors disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isPending ? "Submitting..." : "Submit Suggestion"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
