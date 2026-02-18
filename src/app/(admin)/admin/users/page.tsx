import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Crown,
  Star,
} from "lucide-react";

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-500/15 text-red-400 border-red-500/30",
  MODERATOR: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  USER: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

const tierColors: Record<string, string> = {
  UNVERIFIED: "text-zinc-500",
  VERIFIED: "text-blue-400",
  FEATURED: "text-purple-400",
  MASTER: "text-yellow-400",
};

const tierIcons: Record<string, React.ElementType> = {
  VERIFIED: ShieldCheck,
  FEATURED: Star,
  MASTER: Crown,
};

function RiskBadge({ score }: { score: number }) {
  let color = "bg-green-500/15 text-green-400 border-green-500/30";
  if (score >= 70) {
    color = "bg-red-500/15 text-red-400 border-red-500/30";
  } else if (score >= 30) {
    color = "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
  }
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${color}`}
    >
      {score}
    </span>
  );
}

const PER_PAGE = 20;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10));
  const query = q?.trim() || "";

  const where = query
    ? {
        OR: [
          { username: { contains: query, mode: "insensitive" as const } },
          { email: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, totalCount] = await Promise.all([
    db.user.findMany({
      where,
      take: PER_PAGE,
      skip: (currentPage - 1) * PER_PAGE,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        role: true,
        verificationTier: true,
        riskScore: true,
        reputation: true,
        createdAt: true,
      },
    }),
    db.user.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / PER_PAGE);

  function buildUrl(params: Record<string, string | undefined>) {
    const search = new URLSearchParams();
    if (params.q) search.set("q", params.q);
    if (params.page && params.page !== "1") search.set("page", params.page);
    const qs = search.toString();
    return `/admin/users${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          PILOT REGISTRY
        </h1>
        <p className="text-sm text-muted-foreground mt-1">User Management</p>
      </div>

      {/* Search */}
      <form action="/admin/users" method="GET">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search by username or email..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border/50 bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gx-red/50 focus:border-gx-red/50 transition-colors"
          />
        </div>
      </form>

      {/* Table */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Pilot
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Risk
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Rep
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {users.map((user) => {
                const TierIcon = tierIcons[user.verificationTier];
                return (
                  <tr
                    key={user.id}
                    className="hover:bg-muted/20 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="flex items-center gap-3 group-hover:text-gx-red transition-colors"
                      >
                        <div className="h-8 w-8 rounded-full overflow-hidden bg-muted shrink-0">
                          {user.avatar ? (
                            <Image
                              src={user.avatar}
                              alt={user.username}
                              width={32}
                              height={32}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                              {user.username[0]?.toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {user.username}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${
                          roleColors[user.role]
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className={`flex items-center gap-1 text-xs font-medium ${
                          tierColors[user.verificationTier]
                        }`}
                      >
                        {TierIcon && <TierIcon className="h-3.5 w-3.5" />}
                        {user.verificationTier}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <RiskBadge score={user.riskScore} />
                    </td>
                    <td className="px-4 py-3 text-foreground font-medium text-xs">
                      {user.reputation.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {user.createdAt.toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    {query
                      ? `No pilots found matching "${query}".`
                      : "No registered pilots yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {(currentPage - 1) * PER_PAGE + 1}\u2013
            {Math.min(currentPage * PER_PAGE, totalCount)} of{" "}
            {totalCount.toLocaleString()} pilots
          </p>
          <div className="flex items-center gap-2">
            {currentPage > 1 ? (
              <Link
                href={buildUrl({
                  q: query || undefined,
                  page: String(currentPage - 1),
                })}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/30 text-muted-foreground border border-border/50 hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/10 text-muted-foreground/50 border border-border/30 cursor-not-allowed">
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </span>
            )}
            <span className="text-xs text-muted-foreground px-2">
              {currentPage} / {totalPages}
            </span>
            {currentPage < totalPages ? (
              <Link
                href={buildUrl({
                  q: query || undefined,
                  page: String(currentPage + 1),
                })}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/30 text-muted-foreground border border-border/50 hover:text-foreground transition-colors"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/10 text-muted-foreground/50 border border-border/30 cursor-not-allowed">
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
