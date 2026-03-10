import { getAllSettings } from "@/lib/data/settings";
import { getAdminMission } from "@/lib/data/missions";
import { Settings2 } from "lucide-react";
import { SettingsForm } from "./components/settings-form";

export default async function AdminSettingsPage() {
  const [settings, mission] = await Promise.all([
    getAllSettings(),
    getAdminMission(),
  ]);

  const missionData = mission
    ? {
        id: mission.id,
        title: mission.title,
        description: mission.description,
        rules: mission.rules ?? null,
        prizes: mission.prizes ?? null,
        startDate: mission.startDate.toISOString().slice(0, 16),
        endDate: mission.endDate.toISOString().slice(0, 16),
        isActive: mission.isActive,
        submissionCount: mission._count.submissions,
      }
    : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Settings2 className="h-6 w-6 text-gx-gold" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            SYSTEM SETTINGS
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Configure platform behavior
        </p>
      </div>

      <SettingsForm initialSettings={settings} mission={missionData} />
    </div>
  );
}
