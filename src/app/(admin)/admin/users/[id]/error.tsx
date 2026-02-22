"use client";

export default function UserDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-8 space-y-4">
      <h2 className="text-xl font-bold text-red-400">
        Error Loading User Details
      </h2>
      <p className="text-sm text-muted-foreground">
        {error.message || "An unexpected error occurred."}
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground font-mono">
          Digest: {error.digest}
        </p>
      )}
      <pre className="text-xs text-red-300/70 bg-red-500/10 rounded-lg p-4 overflow-auto max-h-60 whitespace-pre-wrap">
        {error.stack || String(error)}
      </pre>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
