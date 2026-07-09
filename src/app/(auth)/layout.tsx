export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-10">
      <div className="mb-8 flex items-center gap-2">
        <span className="text-2xl font-bold tracking-tight">EstéticaOS</span>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
