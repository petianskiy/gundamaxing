import { Palette, Layers, Eye, EyeOff } from "lucide-react";
import { getAdminThemes } from "@/lib/data/admin-themes";
import { ThemeList } from "./components/theme-list";

export default async function AdminThemesPage() {
  const themes = await getAdminThemes();

  const totalThemes = themes.length;
  const publishedThemes = themes.filter((t) => t.isPublished).length;
  const draftThemes = totalThemes - publishedThemes;
  const avgLevel = totalThemes > 0 ? Math.round(themes.reduce((sum, t) => sum + t.unlockLevel, 0) / totalThemes) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Palette className="h-6 w-6 text-gx-gold" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            HANGAR THEME STUDIO
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Create and manage custom hangar themes for users to unlock
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Layers className="h-4 w-4" />}
          label="Total Themes"
          value={totalThemes}
        />
        <StatCard
          icon={<Eye className="h-4 w-4" />}
          label="Published"
          value={publishedThemes}
        />
        <StatCard
          icon={<EyeOff className="h-4 w-4" />}
          label="Drafts"
          value={draftThemes}
        />
        <StatCard
          icon={<Palette className="h-4 w-4" />}
          label="Avg Level"
          value={avgLevel}
        />
      </div>

      {/* Theme List */}
      <ThemeList themes={themes} />
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
