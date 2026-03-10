"use client";

import { useState, useTransition } from "react";
import {
  Search,
  Pin,
  Lock,
  Unlock,
  ArrowRightLeft,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageSquare,
} from "lucide-react";
import {
  adminTogglePin,
  adminToggleLock,
  adminMoveThread,
} from "@/lib/actions/admin-forum";
import { adminDeleteThread } from "@/lib/actions/admin-content";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
  color: string;
  children: { id: string; name: string; color: string }[];
}

interface ThreadManagerProps {
  categories: Category[];
}

interface ThreadRow {
  id: string;
  title: string;
  isPinned: boolean;
  isLocked: boolean;
  views: number;
  replyCount: number;
  createdAt: Date;
  user: { username: string };
  category: { name: string; color: string };
}

export function ThreadManager({ categories }: ThreadManagerProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [moveThreadId, setMoveThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);

  // All categories flat for selectors
  const allCategories = categories.flatMap((c) => [
    { id: c.id, name: c.name, color: c.color },
    ...c.children.map((ch) => ({ id: ch.id, name: `  ↳ ${ch.name}`, color: ch.color })),
  ]);

  async function loadThreads(p = 1) {
    startTransition(async () => {
      const params = new URLSearchParams();
      params.set("search", search);
      params.set("categoryId", categoryFilter);
      params.set("page", String(p));
      params.set("pageSize", String(pageSize));

      const res = await fetch(`/api/admin/forum/threads?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setThreads(data.threads);
        setTotal(data.total);
        setPage(p);
        setLoaded(true);
      }
    });
  }

  async function handleTogglePin(threadId: string) {
    setActionLoading(threadId);
    const result = await adminTogglePin(threadId);
    setActionLoading(null);
    if (result.error) {
      setError(result.error);
    } else {
      await loadThreads(page);
    }
  }

  async function handleToggleLock(threadId: string) {
    setActionLoading(threadId);
    const result = await adminToggleLock(threadId);
    setActionLoading(null);
    if (result.error) {
      setError(result.error);
    } else {
      await loadThreads(page);
    }
  }

  async function handleDelete(threadId: string) {
    if (!confirm("Delete this thread? This cannot be undone.")) return;
    setActionLoading(threadId);
    await adminDeleteThread(threadId);
    setActionLoading(null);
    await loadThreads(page);
  }

  async function handleMove(threadId: string, newCategoryId: string) {
    setActionLoading(threadId);
    const result = await adminMoveThread(threadId, newCategoryId);
    setActionLoading(null);
    setMoveThreadId(null);
    if (result.error) {
      setError(result.error);
    } else {
      await loadThreads(page);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">×</button>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadThreads(1)}
            placeholder="Search threads by title or author..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
        >
          <option value="">All Categories</option>
          {allCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => loadThreads(1)}
          disabled={isPending}
          className="px-4 py-2 rounded-lg bg-gx-gold/15 text-gx-gold text-sm font-medium hover:bg-gx-gold/25 transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </button>
      </div>

      {!loaded ? (
        <div className="rounded-xl border border-border/50 bg-card p-12 text-center text-muted-foreground text-sm">
          Click &quot;Search&quot; to load threads, or enter a search term.
        </div>
      ) : (
        <>
          {/* Thread table */}
          <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Thread
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Stats
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {threads.map((thread) => (
                    <tr key={thread.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 max-w-[250px]">
                        <a
                          href={`/thread/${thread.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground font-medium hover:text-gx-gold truncate block"
                        >
                          {thread.title}
                        </a>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(thread.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {thread.user.username}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold"
                          style={{
                            backgroundColor: `${thread.category.color}15`,
                            color: thread.category.color,
                          }}
                        >
                          {thread.category.name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {thread.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {thread.replyCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {thread.isPinned && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
                              <Pin className="h-2.5 w-2.5" />
                              PIN
                            </span>
                          )}
                          {thread.isLocked && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
                              <Lock className="h-2.5 w-2.5" />
                              LOCK
                            </span>
                          )}
                          {!thread.isPinned && !thread.isLocked && (
                            <span className="text-xs text-muted-foreground/50">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {actionLoading === thread.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : moveThreadId === thread.id ? (
                          <div className="flex items-center gap-1">
                            <select
                              onChange={(e) => {
                                if (e.target.value) handleMove(thread.id, e.target.value);
                              }}
                              className="px-2 py-1 rounded border border-border/50 bg-card text-xs text-foreground"
                              defaultValue=""
                            >
                              <option value="" disabled>
                                Move to...
                              </option>
                              {allCategories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => setMoveThreadId(null)}
                              className="p-1 text-muted-foreground hover:text-foreground"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => handleTogglePin(thread.id)}
                              className={`p-1.5 rounded transition-colors ${
                                thread.isPinned
                                  ? "text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                                  : "text-muted-foreground hover:text-yellow-400 hover:bg-yellow-500/10"
                              }`}
                              title={thread.isPinned ? "Unpin" : "Pin"}
                            >
                              <Pin className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleLock(thread.id)}
                              className={`p-1.5 rounded transition-colors ${
                                thread.isLocked
                                  ? "text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                                  : "text-muted-foreground hover:text-orange-400 hover:bg-orange-500/10"
                              }`}
                              title={thread.isLocked ? "Unlock" : "Lock"}
                            >
                              {thread.isLocked ? (
                                <Unlock className="h-3.5 w-3.5" />
                              ) : (
                                <Lock className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => setMoveThreadId(thread.id)}
                              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                              title="Move to category"
                            >
                              <ArrowRightLeft className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(thread.id)}
                              className="p-1.5 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {threads.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                        No threads found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} ({total} total)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadThreads(page - 1)}
                  disabled={page <= 1 || isPending}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-3 w-3" />
                  Previous
                </button>
                <button
                  onClick={() => loadThreads(page + 1)}
                  disabled={page >= totalPages || isPending}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
