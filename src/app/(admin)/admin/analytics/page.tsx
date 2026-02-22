import {
  getSignupTrends,
  getBuildTrends,
  getReportTrends,
  getActiveUserCount,
  getRoleDistribution,
  getTopStats,
} from "@/lib/data/analytics";
import { db } from "@/lib/db";
import { BarChart3, Users, Hammer, UserCheck, Flag } from "lucide-react";
import { AnalyticsCharts } from "./components/analytics-charts";

function StatCard({
  icon: Icon,
  iconColor,
  label,
  value,
}: {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconColor}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            {label}
          </p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default async function AdminAnalyticsPage() {
  const [signupTrends, buildTrends, reportTrends, activeUsers, roleDistribution, topStats] =
    await Promise.all([
      getSignupTrends(30),
      getBuildTrends(30),
      getReportTrends(30),
      getActiveUserCount(),
      getRoleDistribution(),
      getTopStats(),
    ]);

  const totalReports30d = reportTrends.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-gx-gold" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            ANALYTICS
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Platform metrics and trends
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          iconColor="bg-blue-500/15 text-blue-400"
          label="Total Users"
          value={topStats.totalUsers.toLocaleString()}
        />
        <StatCard
          icon={Hammer}
          iconColor="bg-green-500/15 text-green-400"
          label="Total Builds"
          value={topStats.totalBuilds.toLocaleString()}
        />
        <StatCard
          icon={UserCheck}
          iconColor="bg-purple-500/15 text-purple-400"
          label="Active Users (7d)"
          value={activeUsers.toLocaleString()}
        />
        <StatCard
          icon={Flag}
          iconColor="bg-red-500/15 text-red-400"
          label="Total Reports (30d)"
          value={totalReports30d.toLocaleString()}
        />
      </div>

      {/* Charts */}
      <AnalyticsCharts
        signupTrends={signupTrends}
        buildTrends={buildTrends}
        reportTrends={reportTrends}
        roleDistribution={roleDistribution}
      />
    </div>
  );
}
