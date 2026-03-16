import { LayoutTemplate, Layers, Image, ToggleRight } from "lucide-react";
import { getAdminTemplates } from "@/lib/data/admin-templates";
import { TemplatesTable } from "./components/templates-table";

export default async function AdminTemplatesPage() {
  const templates = await getAdminTemplates();

  const totalTemplates = templates.length;
  const activeTemplates = templates.filter((t) => t.isActive).length;
  const totalSlots = templates.reduce((sum, t) => sum + t.slots.length, 0);
  const totalImages = templates.reduce((sum, t) => sum + t.imageCount, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <LayoutTemplate className="h-6 w-6 text-gx-gold" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            TEMPLATE MANAGER
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Manage custom showcase editor templates
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Layers className="h-4 w-4" />}
          label="Templates"
          value={totalTemplates}
        />
        <StatCard
          icon={<ToggleRight className="h-4 w-4" />}
          label="Active"
          value={activeTemplates}
        />
        <StatCard
          icon={<Image className="h-4 w-4" />}
          label="Total Slots"
          value={totalSlots}
        />
        <StatCard
          icon={<Image className="h-4 w-4" />}
          label="Image Slots"
          value={totalImages}
        />
      </div>

      {/* Templates Table */}
      <TemplatesTable templates={templates} />
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
