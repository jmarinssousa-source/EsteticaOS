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

/**
 * Máscara de dinheiro no padrão brasileiro. Os dígitos entram pela
 * direita preenchendo os centavos, como em caixa de supermercado:
 * "9" → "0,09", "900" → "9,00", "900000" → "9.000,00".
 */
export function formatCurrencyInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 12).replace(/^0+(?=\d)/, "");
  if (!digits) return "";

  const cents = digits.padStart(3, "0");
  const whole = cents.slice(0, -2);
  const decimals = cents.slice(-2);
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${decimals}`;
}

/** Converte "9.000,00" no número que o servidor espera (9000). */
export function parseCurrencyInput(masked: string): string {
  const digits = masked.replace(/\D/g, "");
  if (!digits) return "";
  return (Number(digits) / 100).toFixed(2);
}

export function formatCpf(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  let out = d.slice(0, 3);
  if (d.length > 3) out += `.${d.slice(3, 6)}`;
  if (d.length > 6) out += `.${d.slice(6, 9)}`;
  if (d.length > 9) out += `-${d.slice(9, 11)}`;
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
