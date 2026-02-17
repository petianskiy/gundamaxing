import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  Crown,
  Star,
  Ban,
  UserCheck,
  Trash2,
  AlertTriangle,
  Clock,
  Package,
  MessageCircle,
  Heart,
  Flag,
  Activity,
  Globe,
  Twitter,
  Youtube,
  Instagram,
} from "lucide-react";

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-500/15 text-red-400 border-red-500/30",
  MODERATOR: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  USER: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

const tierRingColors: Record<string, string> = {
  UNVERIFIED: "ring-zinc-600",
  VERIFIED: "ring-blue-500",
  FEATURED: "ring-purple-500",
  MASTER: "ring-yellow-500",
};

const actionTypeColors: Record<string, string> = {
  WARN: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  MUTE: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  BAN: "bg-red-500/15 text-red-400 border-red-500/30",
  UNBAN: "bg-green-500/15 text-green-400 border-green-500/30",
  DELETE_CONTENT: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  APPROVE_CONTENT: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

async function changeRole(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");
  const userId = formData.get("userId") as string;
  const newRole = formData.get("role") as "USER" | "MODERATOR" | "ADMIN";
  await db.user.update({ where: { id: userId }, data: { role: newRole } });
  await db.moderationAction.create({
    data: {
      type: "APPROVE_CONTENT",
      reason: `Role changed to ${newRole}`,
      targetUserId: userId,
      moderatorId: session.user.id!,
    },
  });
  revalidatePath(`/admin/users/${userId}`);
}

async function toggleBan(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");
  const userId = formData.get("userId") as string;
  const action = formData.get("action") as "BAN" | "UNBAN";
  await db.user.update({
    where: { id: userId },
    data: { riskScore: action === "BAN" ? 100 : 0 },
  });
  await db.moderationAction.create({
    data: {
      type: action,
      reason: `${action === "BAN" ? "Banned" : "Unbanned"} by admin`,
      targetUserId: userId,
      moderatorId: session.user.id!,
    },
  });
  revalidatePath(`/admin/users/${userId}`);
}

async function adjustRiskScore(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR")) redirect("/");
  const userId = formData.get("userId") as string;
  const score = Math.max(0, Math.min(100, parseInt(formData.get("riskScore") as string, 10)));
  await db.user.update({ where: { id: userId }, data: { riskScore: score } });
  revalidatePath(`/admin/users/${userId}`);
}

async function deleteAccount(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");
  const userId = formData.get("userId") as string;
  await db.user.delete({ where: { id: userId } });
  redirect("/admin/users");
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id },
    include: {
      badges: { include: { badge: true } },
      _count: {
        select: {
          builds: true,
          comments: true,
          likes: true,
          reportsFiled: true,
          reportsReceived: true,
        },
      },
    },
  });

  if (!user) notFound();

  const [recentEvents, moderationHistory] = await Promise.all([
    db.eventLog.findMany({
      where: { userId: id },
      take: 20,
      orderBy: { createdAt: "desc" },
    }),
    db.moderationAction.findMany({
      where: { targetUserId: id },
      orderBy: { createdAt: "desc" },
      include: {
        moderator: { select: { username: true, handle: true } },
      },
    }),
  ]);

  const isBanned = user.riskScore >= 100;
  const socialLinks = (user.socialLinks as Record<string, string> | null) || {};

  const socialIcons: Record<string, React.ElementType> = {
    twitter: Twitter,
    youtube: Youtube,
    instagram: Instagram,
    website: Globe,
  };

  return (
    <div className="space-y-8">
      {/* Header with banner */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        {/* Banner */}
        <div className="relative h-32 bg-gradient-to-r from-gx-surface to-gx-surface-elevated">
          {user.banner && (
            <Image
              src={user.banner}
              alt="Banner"
              fill
              className="object-cover"
              unoptimized
            />
          )}
        </div>

        {/* Profile info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row gap-4 -mt-10">
            {/* Avatar */}
            <div
              className={`h-20 w-20 rounded-full ring-4 ring-offset-4 ring-offset-card overflow-hidden bg-muted shrink-0 ${
                tierRingColors[user.verificationTier]
              }`}
            >
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.username}
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
                  {user.username[0]?.toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 pt-2 sm:pt-12">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">
                  {user.displayName || user.username}
                </h1>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${
                    roleColors[user.role]
                  }`}
                >
                  {user.role}
                </span>
                {isBanned && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border bg-red-500/20 text-red-400 border-red-500/40">
                    <Ban className="h-3 w-3" />
                    BANNED
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                @{user.handle} &middot; {user.email}
              </p>
              {user.bio && (
                <p className="text-sm text-zinc-300 mt-2 max-w-lg leading-relaxed">
                  {user.bio}
                </p>
              )}

              {/* Social Links */}
              {Object.keys(socialLinks).length > 0 && (
                <div className="flex gap-2 mt-3">
                  {Object.entries(socialLinks).map(([platform, url]) => {
                    const SocialIcon = socialIcons[platform] || Globe;
                    return (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <SocialIcon className="h-4 w-4" />
                      </a>
                    );
                  })}
                </div>
              )}

              {/* Badges */}
              {user.badges.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {user.badges.map((ub) => (
                    <span
                      key={ub.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground"
                      title={ub.badge.description}
                    >
                      {ub.badge.icon} {ub.badge.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { icon: Package, label: "Builds", value: user._count.builds },
          { icon: MessageCircle, label: "Comments", value: user._count.comments },
          { icon: Heart, label: "Likes Given", value: user._count.likes },
          { icon: Flag, label: "Reports Filed", value: user._count.reportsFiled },
          { icon: AlertTriangle, label: "Reports Received", value: user._count.reportsReceived },
          { icon: Star, label: "Reputation", value: user.reputation },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-border/50 bg-card p-4 text-center"
          >
            <Icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-lg font-bold text-foreground">{value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile Details */}
        <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Profile Details
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Country</dt>
              <dd className="text-foreground">{user.country || "--"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Skill Level</dt>
              <dd className="text-foreground">{user.skillLevel || "--"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Level</dt>
              <dd className="text-foreground">{user.level}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Risk Score</dt>
              <dd>
                <span
                  className={`font-bold ${
                    user.riskScore >= 70
                      ? "text-red-400"
                      : user.riskScore >= 30
                        ? "text-yellow-400"
                        : "text-green-400"
                  }`}
                >
                  {user.riskScore}
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tier</dt>
              <dd className="text-foreground">{user.verificationTier}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Joined</dt>
              <dd className="text-foreground">
                {user.createdAt.toLocaleDateString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Registration IP</dt>
              <dd className="text-foreground font-mono text-xs">
                {user.registrationIp || "--"}
              </dd>
            </div>
          </dl>

          {/* Preferred Grades & Techniques */}
          {user.preferredGrades.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Preferred Grades</p>
              <div className="flex flex-wrap gap-1">
                {user.preferredGrades.map((g) => (
                  <span
                    key={g}
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}
          {user.techniques.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Techniques</p>
              <div className="flex flex-wrap gap-1">
                {user.techniques.map((t) => (
                  <span
                    key={t}
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Admin Actions */}
        <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Admin Actions
          </h3>

          {/* Change Role */}
          <form action={changeRole} className="space-y-2">
            <input type="hidden" name="userId" value={user.id} />
            <label className="text-xs text-muted-foreground">Change Role</label>
            <div className="flex gap-2">
              <select
                name="role"
                defaultValue={user.role}
                className="flex-1 px-3 py-1.5 rounded-lg border border-border/50 bg-muted/30 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gx-red/50"
              >
                <option value="USER">USER</option>
                <option value="MODERATOR">MODERATOR</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
              >
                Update
              </button>
            </div>
          </form>

          {/* Ban / Unban */}
          <form action={toggleBan}>
            <input type="hidden" name="userId" value={user.id} />
            <input
              type="hidden"
              name="action"
              value={isBanned ? "UNBAN" : "BAN"}
            />
            <button
              type="submit"
              className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                isBanned
                  ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
                  : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
              }`}
            >
              {isBanned ? (
                <>
                  <UserCheck className="h-3.5 w-3.5" /> Unban User
                </>
              ) : (
                <>
                  <Ban className="h-3.5 w-3.5" /> Ban User
                </>
              )}
            </button>
          </form>

          {/* Adjust Risk Score */}
          <form action={adjustRiskScore} className="space-y-2">
            <input type="hidden" name="userId" value={user.id} />
            <label className="text-xs text-muted-foreground">
              Adjust Risk Score
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                name="riskScore"
                defaultValue={user.riskScore}
                min={0}
                max={100}
                className="flex-1 px-3 py-1.5 rounded-lg border border-border/50 bg-muted/30 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gx-red/50"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors"
              >
                Set
              </button>
            </div>
          </form>

          {/* Delete Account */}
          <form action={deleteAccount}>
            <input type="hidden" name="userId" value={user.id} />
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20 transition-colors"
              onClick={(e) => {
                // Note: onClick won't work in server components
                // You'd need a client component wrapper for confirmation
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Account
            </button>
          </form>
        </div>

        {/* Moderation History */}
        <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Moderation History
          </h3>
          {moderationHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No moderation actions on record.
            </p>
          ) : (
            <div className="space-y-2">
              {moderationHistory.map((action) => (
                <div
                  key={action.id}
                  className="p-3 rounded-lg bg-muted/20 border border-border/30 space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${
                        actionTypeColors[action.type] ??
                        "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
                      }`}
                    >
                      {action.type}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      by @{action.moderator.handle}
                    </span>
                  </div>
                  {action.reason && (
                    <p className="text-xs text-zinc-400">{action.reason}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {action.createdAt.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Events */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-gx-gold" />
          <h2 className="text-lg font-bold text-foreground tracking-wide">
            RECENT ACTIVITY
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
                    IP
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
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border bg-zinc-500/15 text-zinc-400 border-zinc-500/30">
                        {event.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {event.ipAddress ?? "--"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {event.createdAt.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[250px] truncate">
                      {event.metadata
                        ? JSON.stringify(event.metadata).slice(0, 100)
                        : "--"}
                    </td>
                  </tr>
                ))}
                {recentEvents.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No activity recorded for this pilot.
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
