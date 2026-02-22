import {
  getAdminBuilds,
  getAdminComments,
  getAdminThreads,
  getTotalBuildCount,
  getTotalCommentCount,
  getTotalThreadCount,
  getDeletionHistory,
  getDeletionHistoryCount,
} from "@/lib/data/admin-content";
import {
  adminDeleteBuild,
  adminDeleteComment,
  adminDeleteThread,
} from "@/lib/actions/admin-content";
import { DeleteConfirmButton } from "./components/delete-confirm-button";
import { FileText, Search, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import Link from "next/link";

const statusBadge: Record<string, string> = {
  WIP: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  COMPLETED: "bg-green-500/15 text-green-400 border-green-500/30",
  ABANDONED: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; search?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const tab = params.tab ?? "builds";
  const search = params.search ?? "";
  const status = params.status ?? "ALL";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const pageSize = 20;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-gx-gold" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            CONTENT MANAGEMENT
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Manage builds, comments, and threads
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        {(["builds", "comments", "threads", "history"] as const).map((t) => (
          <Link
            key={t}
            href={`/admin/content?tab=${t}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? "bg-gx-gold/15 text-gx-gold border border-gx-gold/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Link>
        ))}
      </div>

      {/* Search + Filters */}
      <form className="flex items-center gap-3">
        <input type="hidden" name="tab" value={tab} />
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
          />
        </div>
        {tab === "builds" && (
          <select
            name="status"
            defaultValue={status}
            className="px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
          >
            <option value="ALL">All Status</option>
            <option value="WIP">WIP</option>
            <option value="COMPLETED">Completed</option>
            <option value="ABANDONED">Abandoned</option>
          </select>
        )}
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-gx-gold/15 text-gx-gold text-sm font-medium hover:bg-gx-gold/25 transition-colors"
        >
          Filter
        </button>
      </form>

      {/* Content Table */}
      {tab === "builds" && (
        <BuildsTable search={search} status={status} page={page} pageSize={pageSize} />
      )}
      {tab === "comments" && (
        <CommentsTable search={search} page={page} pageSize={pageSize} />
      )}
      {tab === "threads" && (
        <ThreadsTable search={search} page={page} pageSize={pageSize} />
      )}
      {tab === "history" && (
        <DeletionHistoryTable page={page} pageSize={pageSize} />
      )}
    </div>
  );
}

async function BuildsTable({
  search,
  status,
  page,
  pageSize,
}: {
  search: string;
  status: string;
  page: number;
  pageSize: number;
}) {
  const [builds, total] = await Promise.all([
    getAdminBuilds({ search, status, page, pageSize }),
    getTotalBuildCount({ search, status }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Author
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Likes
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Comments
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {builds.map((build) => (
                <tr key={build.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-foreground font-medium max-w-[200px] truncate">
                    {build.title}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {build.user.username}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${
                        statusBadge[build.status] ?? "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
                      }`}
                    >
                      {build.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {build._count.likes}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {build._count.comments}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {build.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <DeleteConfirmButton
                      action={async () => { "use server"; await adminDeleteBuild(build.id); }}
                      itemType="build"
                    />
                  </td>
                </tr>
              ))}
              {builds.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No builds found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination tab="builds" search={search} status={status} page={page} totalPages={totalPages} />
    </>
  );
}

async function CommentsTable({
  search,
  page,
  pageSize,
}: {
  search: string;
  page: number;
  pageSize: number;
}) {
  const [comments, total] = await Promise.all([
    getAdminComments({ search, page, pageSize }),
    getTotalCommentCount({ search }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Content
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Author
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Build
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Likes
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {comments.map((comment) => (
                <tr key={comment.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-foreground max-w-[300px] truncate">
                    {comment.content.slice(0, 80)}
                    {comment.content.length > 80 ? "..." : ""}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {comment.user.username}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[150px] truncate">
                    {comment.build?.title ?? "--"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {comment.likeCount}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {comment.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <DeleteConfirmButton
                      action={async () => { "use server"; await adminDeleteComment(comment.id); }}
                      itemType="comment"
                    />
                  </td>
                </tr>
              ))}
              {comments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    No comments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination tab="comments" search={search} page={page} totalPages={totalPages} />
    </>
  );
}

async function ThreadsTable({
  search,
  page,
  pageSize,
}: {
  search: string;
  page: number;
  pageSize: number;
}) {
  const [threads, total] = await Promise.all([
    getAdminThreads({ search, page, pageSize }),
    getTotalThreadCount({ search }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Author
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Replies
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Views
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {threads.map((thread) => (
                <tr key={thread.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-foreground font-medium max-w-[200px] truncate">
                    {thread.title}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {thread.user.username}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {thread.category.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {thread.replyCount}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {thread.views}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {thread.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <DeleteConfirmButton
                      action={async () => { "use server"; await adminDeleteThread(thread.id); }}
                      itemType="thread"
                    />
                  </td>
                </tr>
              ))}
              {threads.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No threads found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination tab="threads" search={search} page={page} totalPages={totalPages} />
    </>
  );
}

async function DeletionHistoryTable({
  page,
  pageSize,
}: {
  page: number;
  pageSize: number;
}) {
  const [history, total] = await Promise.all([
    getDeletionHistory({ page, pageSize }),
    getDeletionHistoryCount(),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  function getContentType(entry: (typeof history)[0]) {
    if (entry.targetBuildId) return "Build";
    if (entry.targetCommentId) return "Comment";
    if (entry.targetThreadId) return "Thread";
    return "Unknown";
  }

  return (
    <>
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Content
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Deleted By
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Deleted At
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {history.map((entry) => (
                <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {getContentType(entry)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground max-w-[400px] truncate">
                    {entry.reason ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {entry.moderator.username}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {entry.createdAt.toLocaleDateString()} {entry.createdAt.toLocaleTimeString()}
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                    No deletion history.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination tab="history" search="" page={page} totalPages={totalPages} />
    </>
  );
}

function Pagination({
  tab,
  search,
  status,
  page,
  totalPages,
}: {
  tab: string;
  search: string;
  status?: string;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const buildQuery = (p: number) => {
    const params = new URLSearchParams();
    params.set("tab", tab);
    if (search) params.set("search", search);
    if (status && status !== "ALL") params.set("status", status);
    params.set("page", String(p));
    return `/admin/content?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={buildQuery(page - 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <ChevronLeft className="h-3 w-3" />
            Previous
          </Link>
        ) : (
          <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-muted-foreground/50 cursor-not-allowed">
            <ChevronLeft className="h-3 w-3" />
            Previous
          </span>
        )}
        {page < totalPages ? (
          <Link
            href={buildQuery(page + 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            Next
            <ChevronRight className="h-3 w-3" />
          </Link>
        ) : (
          <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-muted-foreground/50 cursor-not-allowed">
            Next
            <ChevronRight className="h-3 w-3" />
          </span>
        )}
      </div>
    </div>
  );
}
