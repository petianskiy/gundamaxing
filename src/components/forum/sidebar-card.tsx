export function SidebarCard({
  title,
  accentColor = "var(--gx-red)",
  children,
}: {
  title: string;
  accentColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-forum-border bg-forum-panel/90 overflow-hidden">
      {/* Top accent gradient */}
      <div className="h-0.5" style={{ background: `linear-gradient(to right, ${accentColor}, transparent)` }} />
      <div className="p-4">
        <h3 className="font-orbitron text-[10px] font-bold uppercase tracking-[0.15em] text-gx-red mb-3">
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}
