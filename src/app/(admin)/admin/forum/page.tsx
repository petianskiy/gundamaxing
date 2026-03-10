import {
  MessageSquare,
  Layers,
  Hash,
  MessageCircle,
  TrendingUp,
} from "lucide-react";
import { getAdminCategories, getForumStats } from "@/lib/data/admin-forum";
import { CategoryManager } from "./components/category-manager";
import { ThreadManager } from "./components/thread-manager";

export default async function AdminForumPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const tab = params.tab ?? "categories";

  const [categories, stats] = await Promise.all([
    getAdminCategories(),
    getForumStats(),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-gx-gold" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            FORUM MANAGEMENT
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Manage categories, subcategories, and moderate threads
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Layers className="h-4 w-4" />}
          label="Categories"
          value={stats.totalCategories}
        />
        <StatCard
          icon={<Hash className="h-4 w-4" />}
          label="Total Threads"
          value={stats.totalThreads}
        />
        <StatCard
          icon={<MessageCircle className="h-4 w-4" />}
          label="Forum Replies"
          value={stats.totalComments}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Threads Today"
          value={stats.threadsToday}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        {(["categories", "threads"] as const).map((t) => (
          <a
            key={t}
            href={`/admin/forum?tab=${t}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? "bg-gx-gold/15 text-gx-gold border border-gx-gold/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </a>
        ))}
      </div>

      {/* Content */}
      {tab === "categories" && <CategoryManager categories={categories} />}
      {tab === "threads" && <ThreadManager categories={categories} />}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
    </div>
  );
}
