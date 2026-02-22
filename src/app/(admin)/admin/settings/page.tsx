import { getAllSettings } from "@/lib/data/settings";
import { Settings2 } from "lucide-react";
import { SettingsForm } from "./components/settings-form";

export default async function AdminSettingsPage() {
  const settings = await getAllSettings();

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

      <SettingsForm initialSettings={settings} />
    </div>
  );
}
