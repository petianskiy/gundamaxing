import {
  getAdminKits,
  getAdminKitCount,
  getAdminKitById,
  getAdminSeries,
  getAdminSeriesCount,
  getAdminSuggestions,
  getAdminSuggestionCount,
  getCollectorStats,
  getAllSeriesForDropdown,
} from "@/lib/data/admin-collector";
import { KitsTable } from "./components/kits-table";
import { KitForm } from "./components/kit-form";
import { SuggestionsTable } from "./components/suggestions-table";
import { SeriesManager } from "./components/series-manager";
import { BookOpen, Search, ChevronLeft, ChevronRight, Package, Layers, Lightbulb, Eye } from "lucide-react";
import Link from "next/link";

export default async function AdminCollectorPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    search?: string;
    grade?: string;
    category?: string;
    isActive?: string;
    status?: string;
    page?: string;
    mode?: string;
    id?: string;
  }>;
}) {
  const params = await searchParams;
  const tab = params.tab ?? "kits";
  const search = params.search ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const pageSize = 20;

  const stats = await getCollectorStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-gx-gold" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            COLLECTOR MANAGEMENT
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Manage kit database, series, and user suggestions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Total Kits" value={stats.totalKits} />
        <StatCard icon={Eye} label="Active Kits" value={stats.activeKits} />
        <StatCard icon={Layers} label="Series" value={stats.totalSeries} />
        <StatCard
          icon={Lightbulb}
          label="Pending Suggestions"
          value={stats.pendingSuggestions}
          highlight={stats.pendingSuggestions > 0}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        {(["kits", "add", "suggestions", "series"] as const).map((t) => (
          <Link
            key={t}
            href={`/admin/collector?tab=${t}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? "bg-gx-gold/15 text-gx-gold border border-gx-gold/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {t === "add" ? "Add Kit" : t.charAt(0).toUpperCase() + t.slice(1)}
          </Link>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "kits" && (
        <KitsTab
          search={search}
          grade={params.grade}
          category={params.category}
          isActive={params.isActive}
          page={page}
          pageSize={pageSize}
        />
      )}
      {tab === "add" && (
        <AddEditKitTab mode={params.mode} kitId={params.id} />
      )}
      {tab === "suggestions" && (
        <SuggestionsTab status={params.status} page={page} pageSize={pageSize} />
      )}
      {tab === "series" && (
        <SeriesTab search={search} page={page} pageSize={pageSize} />
      )}
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${highlight ? "text-yellow-400" : "text-muted-foreground"}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${highlight ? "text-yellow-400" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

// ─── Kits Tab ───────────────────────────────────────────────────

async function KitsTab({
  search,
  grade,
  category,
  isActive,
  page,
  pageSize,
}: {
  search: string;
  grade?: string;
  category?: string;
  isActive?: string;
  page: number;
  pageSize: number;
}) {
  const filters = { search, grade, category, isActive, page, pageSize };
  const [kits, total] = await Promise.all([
    getAdminKits(filters),
    getAdminKitCount(filters),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      {/* Search + Filters */}
      <form className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="tab" value="kits" />
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search kits..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
          />
        </div>
        <select
          name="category"
          defaultValue={category ?? "ALL"}
          className="px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
        >
          <option value="ALL">All Categories</option>
          <option value="BANDAI">Bandai</option>
          <option value="THIRD_PARTY">3rd Party</option>
        </select>
        <select
          name="isActive"
          defaultValue={isActive ?? ""}
          className="px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-gx-gold/15 text-gx-gold text-sm font-medium hover:bg-gx-gold/25 transition-colors"
        >
          Filter
        </button>
      </form>

      <KitsTable kits={kits} />

      <Pagination tab="kits" search={search} page={page} totalPages={totalPages} extra={{ category, isActive }} />
    </>
  );
}

// ─── Add/Edit Kit Tab ───────────────────────────────────────────

async function AddEditKitTab({ mode, kitId }: { mode?: string; kitId?: string }) {
  const series = await getAllSeriesForDropdown();
  let initialData = null;

  if (mode === "edit" && kitId) {
    initialData = await getAdminKitById(kitId);
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-6">
        {initialData ? `Edit: ${initialData.name}` : "Add New Kit"}
      </h2>
      <KitForm initialData={initialData} series={series} />
    </div>
  );
}

// ─── Suggestions Tab ────────────────────────────────────────────

async function SuggestionsTab({
  status,
  page,
  pageSize,
}: {
  status?: string;
  page: number;
  pageSize: number;
}) {
  const filters = { status, page, pageSize };
  const [suggestions, total] = await Promise.all([
    getAdminSuggestions(filters),
    getAdminSuggestionCount(filters),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <form className="flex items-center gap-3">
        <input type="hidden" name="tab" value="suggestions" />
        <select
          name="status"
          defaultValue={status ?? "ALL"}
          className="px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-gx-gold/15 text-gx-gold text-sm font-medium hover:bg-gx-gold/25 transition-colors"
        >
          Filter
        </button>
      </form>

      <SuggestionsTable suggestions={suggestions} />

      <Pagination tab="suggestions" search="" page={page} totalPages={totalPages} extra={{ status }} />
    </>
  );
}

// ─── Series Tab ─────────────────────────────────────────────────

async function SeriesTab({
  search,
  page,
  pageSize,
}: {
  search: string;
  page: number;
  pageSize: number;
}) {
  const series = await getAdminSeries({ search, page, pageSize });

  return <SeriesManager series={series} />;
}

// ─── Pagination ─────────────────────────────────────────────────

function Pagination({
  tab,
  search,
  page,
  totalPages,
  extra = {},
}: {
  tab: string;
  search: string;
  page: number;
  totalPages: number;
  extra?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const buildQuery = (p: number) => {
    const params = new URLSearchParams();
    params.set("tab", tab);
    if (search) params.set("search", search);
    for (const [k, v] of Object.entries(extra)) {
      if (v && v !== "ALL") params.set(k, v);
    }
    params.set("page", String(p));
    return `/admin/collector?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={buildQuery(page - 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <ChevronLeft className="h-3 w-3" />
            Previous
          </Link>
        ) : (
          <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-muted-foreground/50 cursor-not-allowed">
            <ChevronLeft className="h-3 w-3" />
            Previous
          </span>
        )}
        {page < totalPages ? (
          <Link
            href={buildQuery(page + 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            Next
            <ChevronRight className="h-3 w-3" />
          </Link>
        ) : (
          <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-muted-foreground/50 cursor-not-allowed">
            Next
            <ChevronRight className="h-3 w-3" />
          </span>
        )}
      </div>
    </div>
  );
}
