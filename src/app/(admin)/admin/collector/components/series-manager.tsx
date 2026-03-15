"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { adminCreateSeries, adminUpdateSeries, adminDeleteSeries } from "@/lib/actions/admin-collector";
import type { GundamSeriesUI } from "@/lib/types";

const TIMELINES = [
  "Universal Century",
  "Future Century",
  "After Colony",
  "After War",
  "Correct Century",
  "Cosmic Era",
  "Anno Domini",
  "Advanced Generation",
  "Regild Century",
  "Post Disaster",
  "Ad Stella",
  "Build Series",
];

interface SeriesManagerProps {
  series: GundamSeriesUI[];
}

export function SeriesManager({ series }: SeriesManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{series.length} series</p>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gx-gold/15 text-gx-gold text-xs font-medium border border-gx-gold/30 hover:bg-gx-gold/25 transition-colors"
        >
          <Plus className="h-3 w-3" />
          Add Series
        </button>
      </div>

      {showForm && !editingId && (
        <SeriesForm
          onClose={() => setShowForm(false)}
        />
      )}

      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Japanese
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Timeline
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Years
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Kits
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {series.map((s) => (
                editingId === s.id ? (
                  <tr key={s.id}>
                    <td colSpan={6} className="px-4 py-3">
                      <SeriesForm
                        initialData={s}
                        onClose={() => setEditingId(null)}
                      />
                    </td>
                  </tr>
                ) : (
                  <SeriesRow
                    key={s.id}
                    series={s}
                    onEdit={() => setEditingId(s.id)}
                  />
                )
              ))}
              {series.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    No series found. Add your first one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SeriesRow({ series, onEdit }: { series: GundamSeriesUI; onEdit: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await adminDeleteSeries(series.id);
      setConfirming(false);
    });
  }

  return (
    <tr className="hover:bg-muted/20 transition-colors">
      <td className="px-4 py-3">
        <div>
          <p className="text-foreground font-medium">{series.name}</p>
          {series.abbreviation && (
            <p className="text-[10px] text-muted-foreground">{series.abbreviation}</p>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {series.japaneseTitle || "—"}
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {series.timeline || "—"}
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {series.yearStart ? `${series.yearStart}${series.yearEnd ? `–${series.yearEnd}` : "+"}` : "—"}
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {series.kitCount}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            title="Edit"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-gx-gold hover:bg-gx-gold/10 transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>

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
              title="Delete"
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

function SeriesForm({
  initialData,
  onClose,
}: {
  initialData?: GundamSeriesUI;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initialData?.name ?? "");
  const [japaneseTitle, setJapaneseTitle] = useState(initialData?.japaneseTitle ?? "");
  const [timeline, setTimeline] = useState(initialData?.timeline ?? "");
  const [yearStart, setYearStart] = useState(initialData?.yearStart?.toString() ?? "");
  const [yearEnd, setYearEnd] = useState(initialData?.yearEnd?.toString() ?? "");
  const [abbreviation, setAbbreviation] = useState(initialData?.abbreviation ?? "");
  const [sortOrder, setSortOrder] = useState(initialData?.sortOrder?.toString() ?? "0");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      ...(initialData ? { id: initialData.id } : {}),
      name: name.trim(),
      japaneseTitle: japaneseTitle.trim() || null,
      timeline: timeline || null,
      yearStart: yearStart ? parseInt(yearStart, 10) : null,
      yearEnd: yearEnd ? parseInt(yearEnd, 10) : null,
      abbreviation: abbreviation.trim() || null,
      sortOrder: parseInt(sortOrder, 10) || 0,
    };

    startTransition(async () => {
      const result = initialData
        ? await adminUpdateSeries(payload)
        : await adminCreateSeries(payload);

      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-lg border border-gx-gold/20 bg-gx-gold/5 space-y-3">
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Series name *"
          className="px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
        />
        <input
          type="text"
          value={japaneseTitle}
          onChange={(e) => setJapaneseTitle(e.target.value)}
          placeholder="Japanese title"
          className="px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
        />
        <select
          value={timeline}
          onChange={(e) => setTimeline(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
        >
          <option value="">Timeline...</option>
          {TIMELINES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input
          type="text"
          value={abbreviation}
          onChange={(e) => setAbbreviation(e.target.value)}
          placeholder="Abbrev (e.g. UC, CE)"
          className="px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <input
          type="number"
          value={yearStart}
          onChange={(e) => setYearStart(e.target.value)}
          placeholder="Year start"
          className="px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
        />
        <input
          type="number"
          value={yearEnd}
          onChange={(e) => setYearEnd(e.target.value)}
          placeholder="Year end"
          className="px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
        />
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          placeholder="Sort order"
          className="px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gx-gold/15 text-gx-gold text-xs font-medium border border-gx-gold/30 hover:bg-gx-gold/25 transition-colors disabled:opacity-50"
        >
          <Save className="h-3 w-3" />
          {isPending ? "Saving..." : initialData ? "Update" : "Create"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <X className="h-3 w-3" />
          Cancel
        </button>
      </div>
    </form>
  );
}
