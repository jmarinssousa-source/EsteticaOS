// Fixed categorical palette for identifying professionals at a glance in
// the agenda. Order is fixed and never regenerated — a professional's color
// is derived deterministically from their id so it stays stable across
// renders, filters and page loads without needing a DB column.
const PALETTE = [
  { dot: "bg-blue-500", tint: "bg-blue-500/8" },
  { dot: "bg-violet-500", tint: "bg-violet-500/8" },
  { dot: "bg-teal-500", tint: "bg-teal-500/8" },
  { dot: "bg-rose-500", tint: "bg-rose-500/8" },
  { dot: "bg-amber-500", tint: "bg-amber-500/8" },
  { dot: "bg-cyan-500", tint: "bg-cyan-500/8" },
  { dot: "bg-lime-500", tint: "bg-lime-500/8" },
  { dot: "bg-fuchsia-500", tint: "bg-fuchsia-500/8" },
] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getProfessionalColor(professionalId: string | null): (typeof PALETTE)[number] | null {
  if (!professionalId) return null;
  return PALETTE[hashString(professionalId) % PALETTE.length];
}
