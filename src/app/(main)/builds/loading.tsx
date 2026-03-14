export default function BuildsLoading() {
  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/images/builds-bg.jpg')" }} />
      <div className="fixed inset-0 -z-10 bg-black/60" />
      <div className="max-w-[470px] mx-auto space-y-5 pt-24 px-4 pb-12">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card overflow-hidden animate-pulse">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 bg-muted rounded" />
                <div className="h-2.5 w-16 bg-muted rounded" />
              </div>
            </div>
            <div className="aspect-square bg-muted" />
            <div className="px-4 py-3 space-y-2">
              <div className="h-3 w-32 bg-muted rounded" />
              <div className="h-3 w-48 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
