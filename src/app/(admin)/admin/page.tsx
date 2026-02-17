import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Users, UserPlus, Flag, Shield, Activity, Clock } from "lucide-react";

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

const eventTypeSeverity: Record<string, string> = {
  SIGNUP_ATTEMPT: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  SIGNUP_SUCCESS: "bg-green-500/15 text-green-400 border-green-500/30",
  SIGNUP_BLOCKED: "bg-red-500/15 text-red-400 border-red-500/30",
  LOGIN_ATTEMPT: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  LOGIN_SUCCESS: "bg-green-500/15 text-green-400 border-green-500/30",
  LOGIN_FAILED: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  CAPTCHA_SERVED: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  CAPTCHA_PASSED: "bg-green-500/15 text-green-400 border-green-500/30",
  CAPTCHA_FAILED: "bg-red-500/15 text-red-400 border-red-500/30",
  RATE_LIMIT_HIT: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  COMMENT_BLOCKED: "bg-red-500/15 text-red-400 border-red-500/30",
  CONTENT_FLAGGED: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  REPORT_CREATED: "bg-red-500/15 text-red-400 border-red-500/30",
  MODERATION_ACTION: "bg-red-500/15 text-red-400 border-red-500/30",
  EMAIL_VERIFICATION_SENT: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  EMAIL_VERIFICATION_COMPLETE: "bg-green-500/15 text-green-400 border-green-500/30",
  PASSWORD_RESET_REQUESTED: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  PASSWORD_RESET_COMPLETE: "bg-green-500/15 text-green-400 border-green-500/30",
};

export default async function AdminDashboardPage() {
  const session = await auth();

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const [
    totalUsers,
    usersToday,
    pendingReports,
    captchaPassed,
    captchaFailed,
    recentEvents,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({
      where: { createdAt: { gte: todayStart } },
    }),
    db.report.count({
      where: { status: "PENDING" },
    }),
    db.eventLog.count({
      where: {
        type: "CAPTCHA_PASSED",
        createdAt: { gte: twentyFourHoursAgo },
      },
    }),
    db.eventLog.count({
      where: {
        type: "CAPTCHA_FAILED",
        createdAt: { gte: twentyFourHoursAgo },
      },
    }),
    db.eventLog.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { username: true } } },
    }),
  ]);

  const totalCaptcha = captchaPassed + captchaFailed;
  const captchaRate =
    totalCaptcha > 0
      ? Math.round((captchaPassed / totalCaptcha) * 100)
      : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          COMMAND CENTER
        </h1>
        <p className="text-sm text-muted-foreground mt-1">System Overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          iconColor="bg-blue-500/15 text-blue-400"
          label="Total Pilots"
          value={totalUsers.toLocaleString()}
        />
        <StatCard
          icon={UserPlus}
          iconColor="bg-green-500/15 text-green-400"
          label="New Today"
          value={usersToday}
        />
        <StatCard
          icon={Flag}
          iconColor="bg-red-500/15 text-red-400"
          label="Pending Reports"
          value={pendingReports}
        />
        <StatCard
          icon={Shield}
          iconColor="bg-purple-500/15 text-purple-400"
          label="Captcha Pass Rate"
          value={`${captchaRate}%`}
        />
      </div>

      {/* Recent Events */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-gx-gold" />
          <h2 className="text-lg font-bold text-foreground tracking-wide">
            RECENT EVENTS
          </h2>
        </div>

        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {recentEvents.map((event) => (
                  <tr
                    key={event.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${
                          eventTypeSeverity[event.type] ??
                          "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
                        }`}
                      >
                        {event.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {event.user?.username ?? (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {event.ipAddress ?? "--"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {event.createdAt.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                      {event.metadata
                        ? JSON.stringify(event.metadata).slice(0, 80)
                        : "--"}
                    </td>
                  </tr>
                ))}
                {recentEvents.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      No events recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
