export function SignatureDisplay({ dataUrl, label }: { dataUrl: string; label: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dataUrl} alt={label} className="h-24 rounded-md border bg-white object-contain" />
    </div>
  );
}
