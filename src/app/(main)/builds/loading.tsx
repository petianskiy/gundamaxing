export default function BuildsLoading() {
  return (
    <div className="relative min-h-screen">
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/builds-bg.jpg')" }}
      />
      <div className="fixed inset-0 -z-10 bg-black/60" />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header skeleton */}
          <div className="text-center mb-10">
            <div className="h-4 w-40 bg-muted rounded mx-auto mb-3" />
            <div className="h-8 w-64 bg-muted rounded mx-auto" />
            <div className="h-4 w-80 bg-muted rounded mx-auto mt-3" />
          </div>

          {/* Grid skeleton — matches default grid view */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/50 bg-card overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/3] bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-3.5 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                  <div className="flex gap-1 pt-1">
                    <div className="h-5 w-14 bg-muted rounded-full" />
                    <div className="h-5 w-14 bg-muted rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
