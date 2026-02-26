"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Loader2, Search, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface KlipyGif {
  slug: string;
  title: string;
  url: string;
  previewUrl: string;
  width: number;
  height: number;
}

interface GifPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (gif: { slug: string; title: string; url: string; previewUrl: string; width: number; height: number }) => void;
}

const QUICK_FILTERS = ["Zaku", "RX-78", "Char", "Gunpla", "Wing", "Seed", "Barbatos", "Unicorn"];

export function GifPicker({ open, onClose, onSelect }: GifPickerProps) {
  const [gifs, setGifs] = useState<KlipyGif[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasNext, setHasNext] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchHint, setShowSearchHint] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchGifs = useCallback(async (term: string | null, pageNum: number, append: boolean) => {
    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError("");
    }

    try {
      const url = term
        ? `/api/gifs/search?term=${encodeURIComponent(term)}&page=${pageNum}`
        : `/api/gifs/trending?page=${pageNum}`;

      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error("Failed to fetch GIFs");

      const data = await res.json();

      if (append) {
        setGifs((prev) => {
          const existingSlugs = new Set(prev.map((g: KlipyGif) => g.slug));
          const newGifs = data.gifs.filter((g: KlipyGif) => !existingSlugs.has(g.slug));
          return [...prev, ...newGifs];
        });
      } else {
        setGifs(data.gifs);
      }
      setHasNext(data.hasNext);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError("Could not load GIFs. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Fetch trending on open
  useEffect(() => {
    if (open) {
      setGifs([]);
      setActiveFilter(null);
      setSearchTerm("");
      setShowSearchHint(false);
      setPage(1);
      fetchGifs(null, 1, false);
    }
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [open, fetchGifs]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  function handleFilterClick(term: string) {
    setActiveFilter(term);
    setSearchTerm(term);
    setShowSearchHint(false);
    setPage(1);
    fetchGifs(term, 1, false);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      setShowSearchHint(true);
    }
  }

  function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchGifs(activeFilter, nextPage, true);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-lg mx-4 max-h-[80vh] flex flex-col rounded-xl border border-border/50 bg-card shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <h3 className="text-sm font-bold text-foreground tracking-tight">Gundam GIFs</h3>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 pt-3 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSearchHint(false);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search KLIPY"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-border/50 bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-gx-red/30"
                />
              </div>
              {showSearchHint && (
                <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-muted-foreground">
                  <Info className="h-3 w-3 flex-shrink-0" />
                  Use the filter buttons below to search for GIFs.
                </div>
              )}
            </div>

            {/* Quick filters */}
            <div className="px-4 pb-3 flex flex-wrap gap-1.5">
              {QUICK_FILTERS.map((term) => (
                <button
                  key={term}
                  onClick={() => handleFilterClick(term)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                    activeFilter === term
                      ? "bg-gx-red/20 border-gx-red/40 text-gx-red"
                      : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  {term}
                </button>
              ))}
            </div>

            {/* GIF Grid */}
            <div className="flex-1 overflow-y-auto px-4 pb-2 min-h-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-sm text-red-400">{error}</p>
                  <button
                    onClick={() => fetchGifs(activeFilter, 0, false)}
                    className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors underline"
                  >
                    Try again
                  </button>
                </div>
              ) : gifs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground">No GIFs found. Try a different filter.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {gifs.map((gif) => (
                      <button
                        key={gif.slug}
                        onClick={() => onSelect(gif)}
                        onMouseEnter={() => setHoveredSlug(gif.slug)}
                        onMouseLeave={() => setHoveredSlug(null)}
                        className="relative rounded-lg overflow-hidden border border-border/30 hover:border-gx-red/50 transition-colors bg-muted/30 group cursor-pointer"
                        style={{ aspectRatio: `${gif.width} / ${gif.height}` }}
                        title={gif.title}
                      >
                        <img
                          src={hoveredSlug === gif.slug ? gif.url : gif.previewUrl}
                          alt={gif.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </button>
                    ))}
                  </div>

                  {hasNext && (
                    <div className="flex justify-center py-4">
                      <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="px-4 py-2 rounded-lg border border-border/50 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-border transition-colors disabled:opacity-50"
                      >
                        {loadingMore ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Loading...
                          </span>
                        ) : (
                          "Load more"
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Attribution */}
            <div className="px-4 py-2 border-t border-border/50 text-center">
              <span className="text-[10px] text-muted-foreground/60">Powered by KLIPY</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
