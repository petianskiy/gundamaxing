import { HelpCircle } from "lucide-react";
import { getGuideSteps } from "@/lib/data/admin-guide";
import { GuideStepManager } from "./components/guide-step-manager";

export default async function AdminGuidePage() {
  const steps = await getGuideSteps();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-gx-gold" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            GUIDE EDITOR
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Manage showcase editor guide steps shown to new users
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <span className="text-xs uppercase tracking-wider">Total Steps</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{steps.length}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <span className="text-xs uppercase tracking-wider">Active</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {steps.filter((s) => s.isActive).length}
          </p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <span className="text-xs uppercase tracking-wider">Inactive</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {steps.filter((s) => !s.isActive).length}
          </p>
        </div>
      </div>

      {/* Manager */}
      <GuideStepManager steps={steps} />
    </div>
  );
}
