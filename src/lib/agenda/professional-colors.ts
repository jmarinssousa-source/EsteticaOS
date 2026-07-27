// Paleta categórica fixa para identificar profissionais de relance na
// agenda. O profissional pode escolher a cor (coluna color em
// clinic_members); sem escolha, a cor é derivada deterministicamente do
// user_id para ficar estável entre renders e páginas.
export const PROFESSIONAL_COLORS = {
  blue: {
    label: "Azul",
    dot: "bg-blue-500",
    tint: "bg-blue-500/10",
    border: "border-l-blue-500",
  },
  violet: {
    label: "Violeta",
    dot: "bg-violet-500",
    tint: "bg-violet-500/10",
    border: "border-l-violet-500",
  },
  teal: {
    label: "Verde-água",
    dot: "bg-teal-500",
    tint: "bg-teal-500/10",
    border: "border-l-teal-500",
  },
  rose: {
    label: "Rosa",
    dot: "bg-rose-500",
    tint: "bg-rose-500/10",
    border: "border-l-rose-500",
  },
  amber: {
    label: "Âmbar",
    dot: "bg-amber-500",
    tint: "bg-amber-500/10",
    border: "border-l-amber-500",
  },
  cyan: {
    label: "Ciano",
    dot: "bg-cyan-500",
    tint: "bg-cyan-500/10",
    border: "border-l-cyan-500",
  },
  lime: {
    label: "Lima",
    dot: "bg-lime-500",
    tint: "bg-lime-500/10",
    border: "border-l-lime-500",
  },
  fuchsia: {
    label: "Fúcsia",
    dot: "bg-fuchsia-500",
    tint: "bg-fuchsia-500/10",
    border: "border-l-fuchsia-500",
  },
} as const;

export type ProfessionalColorKey = keyof typeof PROFESSIONAL_COLORS;
export type ProfessionalColor = (typeof PROFESSIONAL_COLORS)[ProfessionalColorKey];

export const PROFESSIONAL_COLOR_KEYS = [
  "blue",
  "violet",
  "teal",
  "rose",
  "amber",
  "cyan",
  "lime",
  "fuchsia",
] as const satisfies readonly ProfessionalColorKey[];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getProfessionalColor(
  professionalId: string | null,
  chosenColor?: string | null,
): ProfessionalColor | null {
  if (!professionalId) return null;
  if (chosenColor && chosenColor in PROFESSIONAL_COLORS) {
    return PROFESSIONAL_COLORS[chosenColor as ProfessionalColorKey];
  }
  const keys = PROFESSIONAL_COLOR_KEYS;
  return PROFESSIONAL_COLORS[keys[hashString(professionalId) % keys.length]];
}
