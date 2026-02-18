import { db } from "@/lib/db";
import Link from "next/link";
import { Activity, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import type { EventType } from "@prisma/client";

const EVENT_TYPES: EventType[] = [
  "SIGNUP_ATTEMPT",
  "SIGNUP_SUCCESS",
  "SIGNUP_BLOCKED",
  "LOGIN_ATTEMPT",
  "LOGIN_SUCCESS",
  "LOGIN_FAILED",
  "CAPTCHA_SERVED",
  "CAPTCHA_PASSED",
  "CAPTCHA_FAILED",
  "RATE_LIMIT_HIT",
  "COMMENT_BLOCKED",
  "CONTENT_FLAGGED",
  "REPORT_CREATED",
  "MODERATION_ACTION",
  "EMAIL_VERIFICATION_SENT",
  "EMAIL_VERIFICATION_COMPLETE",
  "PASSWORD_RESET_REQUESTED",
  "PASSWORD_RESET_COMPLETE",
];

const categoryColors: Record<string, string> = {
  // Auth events - blue
  SIGNUP_ATTEMPT: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  SIGNUP_SUCCESS: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  SIGNUP_BLOCKED: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  LOGIN_ATTEMPT: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  LOGIN_SUCCESS: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  LOGIN_FAILED: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  EMAIL_VERIFICATION_SENT: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  EMAIL_VERIFICATION_COMPLETE: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  PASSWORD_RESET_REQUESTED: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  PASSWORD_RESET_COMPLETE: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  // Captcha events - purple
  CAPTCHA_SERVED: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  CAPTCHA_PASSED: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  CAPTCHA_FAILED: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  // Rate limit - orange
  RATE_LIMIT_HIT: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  // Moderation - red
  COMMENT_BLOCKED: "bg-red-500/15 text-red-400 border-red-500/30",
  CONTENT_FLAGGED: "bg-red-500/15 text-red-400 border-red-500/30",
  REPORT_CREATED: "bg-red-500/15 text-red-400 border-red-500/30",
  MODERATION_ACTION: "bg-red-500/15 text-red-400 border-red-500/30",
};

const PER_PAGE = 50;

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string }>;
}) {
  const { type, page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10));
  const typeFilter = type && EVENT_TYPES.includes(type as EventType) ? (type as EventType) : undefined;

  const where = typeFilter ? { type: typeFilter } : {};

  const [events, totalCount] = await Promise.all([
    db.eventLog.findMany({
      where,
      take: PER_PAGE,
      skip: (currentPage - 1) * PER_PAGE,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { username: true } } },
    }),
    db.eventLog.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / PER_PAGE);

  function buildUrl(params: Record<string, string | undefined>) {
    const search = new URLSearchParams();
    if (params.type) search.set("type", params.type);
    if (params.page && params.page !== "1") search.set("page", params.page);
    const qs = search.toString();
    return `/admin/events${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          COMMS LOG
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Event History</p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex flex-wrap gap-2">
          <Link
            href={buildUrl({ type: undefined, page: "1" })}
            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              !typeFilter
                ? "bg-gx-red/15 text-red-400 border-red-500/30"
                : "bg-muted/30 text-muted-foreground border-border/50 hover:text-foreground"
            }`}
          >
            All
          </Link>
          {EVENT_TYPES.map((t) => (
            <Link
              key={t}
              href={buildUrl({ type: t, page: "1" })}
              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                typeFilter === t
                  ? categoryColors[t]
                  : "bg-muted/30 text-muted-foreground border-border/50 hover:text-foreground"
              }`}
            >
              {t.replace(/_/g, " ")}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
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
              {events.map((event) => (
                <tr
                  key={event.id}
                  className="hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${
                        categoryColors[event.type] ??
                        "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
                      }`}
                    >
                      {event.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {event.user ? (
                      <Link
                        href={`/admin/users/${event.userId}`}
                        className="hover:text-gx-red transition-colors"
                      >
                        @{event.user.username}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">--</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {event.ipAddress ?? "--"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {event.createdAt.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[250px] truncate">
                    {event.metadata
                      ? JSON.stringify(event.metadata).slice(0, 100)
                      : "--"}
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No events found.
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
            {totalCount.toLocaleString()} events
          </p>
          <div className="flex items-center gap-2">
            {currentPage > 1 ? (
              <Link
                href={buildUrl({
                  type: typeFilter,
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
                  type: typeFilter,
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
