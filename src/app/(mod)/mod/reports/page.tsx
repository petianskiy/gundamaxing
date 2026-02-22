import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Flag, AlertTriangle, Trash2, Ban, X, Clock, User } from "lucide-react";

const reasonColors: Record<string, string> = {
  SPAM: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  HARASSMENT: "bg-red-500/15 text-red-400 border-red-500/30",
  INAPPROPRIATE: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  MISINFORMATION: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  OTHER: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

async function dismissReport(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR")) {
    redirect("/");
  }
  const reportId = formData.get("reportId") as string;
  await db.report.update({
    where: { id: reportId },
    data: {
      status: "DISMISSED",
      resolvedAt: new Date(),
      resolvedBy: session.user.id,
    },
  });
  revalidatePath("/mod/reports");
}

async function warnUser(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR")) {
    redirect("/");
  }
  const reportId = formData.get("reportId") as string;
  const targetUserId = formData.get("targetUserId") as string;

  await Promise.all([
    db.moderationAction.create({
      data: {
        type: "WARN",
        reason: "Warning issued from report queue",
        targetUserId,
        moderatorId: session.user.id!,
      },
    }),
    db.report.update({
      where: { id: reportId },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
        resolvedBy: session.user.id,
      },
    }),
  ]);
  revalidatePath("/mod/reports");
}

async function deleteContent(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR")) {
    redirect("/");
  }
  const reportId = formData.get("reportId") as string;
  const buildId = formData.get("buildId") as string | null;
  const commentId = formData.get("commentId") as string | null;

  if (buildId) {
    await db.build.delete({ where: { id: buildId } });
  }
  if (commentId) {
    await db.comment.delete({ where: { id: commentId } });
  }

  await Promise.all([
    db.moderationAction.create({
      data: {
        type: "DELETE_CONTENT",
        reason: "Content deleted from report queue",
        targetBuildId: buildId || undefined,
        targetCommentId: commentId || undefined,
        moderatorId: session.user.id!,
      },
    }),
    db.report.update({
      where: { id: reportId },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
        resolvedBy: session.user.id,
      },
    }),
  ]);
  revalidatePath("/mod/reports");
}

async function banUser(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }
  const reportId = formData.get("reportId") as string;
  const targetUserId = formData.get("targetUserId") as string;

  await Promise.all([
    db.moderationAction.create({
      data: {
        type: "BAN",
        reason: "Banned from report queue",
        targetUserId,
        moderatorId: session.user.id!,
      },
    }),
    db.user.update({
      where: { id: targetUserId },
      data: { riskScore: 100 },
    }),
    db.report.update({
      where: { id: reportId },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
        resolvedBy: session.user.id,
      },
    }),
  ]);
  revalidatePath("/mod/reports");
}

export default async function ModReportsPage() {
  const reports = await db.report.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: {
      reporter: {
        select: { id: true, username: true, avatar: true },
      },
      reportedUser: {
        select: { id: true, username: true, avatar: true },
      },
    },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          THREAT ASSESSMENT
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Report Queue</p>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <Flag className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <p className="text-lg font-semibold text-foreground">All Clear</p>
          <p className="text-sm text-muted-foreground mt-1">
            No pending reports &mdash; all clear, Commander.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="rounded-xl border border-border/50 bg-card p-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                {/* Report Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${
                        reasonColors[report.reason] ??
                        "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
                      }`}
                    >
                      {report.reason}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {report.createdAt.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Reported by</span>
                    <span className="font-medium text-foreground">
                      @{report.reporter.username}
                    </span>
                  </div>

                  {report.reportedUser && (
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                      <span className="text-muted-foreground">Target</span>
                      <span className="font-medium text-red-400">
                        @{report.reportedUser.username}
                      </span>
                    </div>
                  )}

                  {report.description && (
                    <p className="text-sm text-zinc-300 bg-muted/30 rounded-lg p-3 leading-relaxed">
                      {report.description}
                    </p>
                  )}

                  {(report.buildId || report.commentId || report.threadId) && (
                    <div className="text-xs text-muted-foreground">
                      {report.buildId && <span>Build: {report.buildId}</span>}
                      {report.commentId && (
                        <span>Comment: {report.commentId}</span>
                      )}
                      {report.threadId && (
                        <span>Thread: {report.threadId}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 shrink-0">
                  <form action={dismissReport}>
                    <input type="hidden" name="reportId" value={report.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 hover:bg-zinc-500/20 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                      Dismiss
                    </button>
                  </form>

                  {report.reportedUserId && (
                    <form action={warnUser}>
                      <input type="hidden" name="reportId" value={report.id} />
                      <input
                        type="hidden"
                        name="targetUserId"
                        value={report.reportedUserId}
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors"
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Warn
                      </button>
                    </form>
                  )}

                  {(report.buildId || report.commentId) && (
                    <form action={deleteContent}>
                      <input type="hidden" name="reportId" value={report.id} />
                      {report.buildId && (
                        <input
                          type="hidden"
                          name="buildId"
                          value={report.buildId}
                        />
                      )}
                      {report.commentId && (
                        <input
                          type="hidden"
                          name="commentId"
                          value={report.commentId}
                        />
                      )}
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete Content
                      </button>
                    </form>
                  )}

                  {report.reportedUserId && (
                    <form action={banUser}>
                      <input type="hidden" name="reportId" value={report.id} />
                      <input
                        type="hidden"
                        name="targetUserId"
                        value={report.reportedUserId}
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        Ban User
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
