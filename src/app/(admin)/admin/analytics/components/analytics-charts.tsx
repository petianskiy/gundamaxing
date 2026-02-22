"use client";

type TrendPoint = { date: string; count: number };
type RoleCount = { role: string; count: number };

interface AnalyticsChartsProps {
  signupTrends: TrendPoint[];
  buildTrends: TrendPoint[];
  reportTrends: TrendPoint[];
  roleDistribution: RoleCount[];
}

function BarChart({
  data,
  title,
  color,
}: {
  data: TrendPoint[];
  title: string;
  color: string;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
      <div className="flex items-end gap-0.5 h-40">
        {data.length === 0 ? (
          <p className="text-xs text-muted-foreground m-auto">No data</p>
        ) : (
          data.map((point, i) => {
            const height = (point.count / max) * 100;
            return (
              <div
                key={i}
                className={`flex-1 rounded-t transition-all hover:opacity-80 ${color}`}
                style={{ height: `${Math.max(height, 2)}%` }}
                title={`${point.date}: ${point.count}`}
              />
            );
          })
        )}
      </div>
      {data.length > 0 && (
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">
            {data[0]?.date}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {data[data.length - 1]?.date}
          </span>
        </div>
      )}
    </div>
  );
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-500",
  MODERATOR: "bg-amber-500",
  USER: "bg-zinc-500",
};

const roleBgColors: Record<string, string> = {
  ADMIN: "bg-red-500/15",
  MODERATOR: "bg-amber-500/15",
  USER: "bg-zinc-500/15",
};

export function AnalyticsCharts({
  signupTrends,
  buildTrends,
  reportTrends,
  roleDistribution,
}: AnalyticsChartsProps) {
  const totalRoles = roleDistribution.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="space-y-8">
      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <BarChart
            data={signupTrends}
            title="Signup Trend"
            color="bg-blue-500"
          />
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <BarChart
            data={buildTrends}
            title="Build Activity"
            color="bg-green-500"
          />
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <BarChart
            data={reportTrends}
            title="Report Activity"
            color="bg-red-500"
          />
        </div>
      </div>

      {/* Role Distribution */}
      <div className="rounded-xl border border-border/50 bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Role Distribution
        </h3>
        <div className="space-y-3">
          {roleDistribution.map((item) => {
            const pct = totalRoles > 0 ? (item.count / totalRoles) * 100 : 0;
            return (
              <div key={item.role}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {item.role}
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    {item.count}
                  </span>
                </div>
                <div className={`h-2 rounded-full ${roleBgColors[item.role] ?? "bg-zinc-500/15"}`}>
                  <div
                    className={`h-2 rounded-full transition-all ${roleColors[item.role] ?? "bg-zinc-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
