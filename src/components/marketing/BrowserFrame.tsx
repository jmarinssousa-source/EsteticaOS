export function BrowserFrame({
  path,
  className,
  children,
}: {
  path: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`w-full rounded-3xl border border-border bg-card p-5 shadow-2xl shadow-primary/10 ${className ?? ""}`}
    >
      <div className="mb-4 flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-[oklch(0.72_0.14_25)]" />
        <span className="size-2.5 rounded-full bg-champagne" />
        <span className="size-2.5 rounded-full bg-sage" />
        <span className="ml-3 truncate text-xs text-muted-foreground">estetica-os.app{path}</span>
      </div>
      {children}
    </div>
  );
}
