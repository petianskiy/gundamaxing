import { db } from "@/lib/db";

export default async function ModDashboard() {
  const pendingReports = await db.report.count({
    where: { status: "PENDING" },
  });

  const recentActions = await db.moderationAction.count({
    where: {
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">
        Moderator Dashboard
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Pending Reports
          </p>
          <p className="text-3xl font-bold text-foreground mt-2">
            {pendingReports}
          </p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Actions This Week
          </p>
          <p className="text-3xl font-bold text-foreground mt-2">
            {recentActions}
          </p>
        </div>
      </div>
    </div>
  );
}
