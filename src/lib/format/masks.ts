export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";

  let out = `(${digits.slice(0, 2)}`;
  if (digits.length >= 2) out += ") ";

  const rest = digits.slice(2);
  const isMobile = digits.length > 10;
  const splitAt = isMobile ? 5 : 4;

  out += rest.slice(0, splitAt);
  if (rest.length > splitAt) out += `-${rest.slice(splitAt, splitAt + 4)}`;

  return out;
}

export function formatCnpj(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 14);
  let out = d.slice(0, 2);
  if (d.length > 2) out += `.${d.slice(2, 5)}`;
  if (d.length > 5) out += `.${d.slice(5, 8)}`;
  if (d.length > 8) out += `/${d.slice(8, 12)}`;
  if (d.length > 12) out += `-${d.slice(12, 14)}`;
  return out;
}
