export const PATIENT_PAGE_SIZES = [25, 50, 100] as const;
export const DEFAULT_PATIENT_PAGE_SIZE = 25;

/** Caracteres que o PostgREST usa para separar filtros dentro de `or(...)`
 *  — se passarem crus no termo, a busca vira outro filtro. */
const FILTER_BREAKERS = /[,()"'\\%_*]/g;

function sanitize(term: string) {
  return term.replace(FILTER_BREAKERS, " ").trim();
}

export function digitsOf(term: string) {
  return term.replace(/\D/g, "");
}

/**
 * Monta o filtro de busca no servidor. Duas regras, para a busca ser
 * previsível:
 *
 * - texto procura só em nome e e-mail. Procurar o texto também em telefone
 *   e CPF era o que trazia "gente que não tem nada a ver": um pedaço do
 *   nome digitado batia no meio de um número qualquer.
 * - número procura só em telefone e CPF. Como eles são gravados com
 *   máscara — "(11) 99999-8888", "123.456.789-00" — a sequência digitada
 *   vira um padrão que tolera os separadores no meio. Exige 4 dígitos:
 *   com menos, qualquer número da base casa.
 *
 * Devolve null quando não há o que filtrar (busca vazia).
 */
export function buildPatientSearchFilter(rawTerm: string): string | null {
  const term = sanitize(rawTerm);
  if (!term) return null;

  const digits = digitsOf(term);
  const isNumeric = digits.length > 0 && digits.length === term.replace(/[\s.\-()+/]/g, "").length;

  if (isNumeric) {
    if (digits.length < 4) return null;
    const loose = `%${digits.split("").join("%")}%`;
    return `phone.ilike.${loose},cpf.ilike.${loose}`;
  }

  return `name.ilike.%${term}%,email.ilike.%${term}%`;
}

/** Descreve para a pessoa o que a busca está fazendo com o que ela digitou. */
export function describePatientSearch(rawTerm: string): string | null {
  const term = sanitize(rawTerm);
  if (!term) return null;

  const digits = digitsOf(term);
  const isNumeric = digits.length > 0 && digits.length === term.replace(/[\s.\-()+/]/g, "").length;

  if (!isNumeric) return "Buscando por nome ou e-mail.";
  if (digits.length < 4) return "Digite pelo menos 4 números para buscar por telefone ou CPF.";
  return "Buscando por telefone ou CPF.";
}

export function parsePageSize(raw: string | undefined): number {
  const value = Number(raw);
  return (PATIENT_PAGE_SIZES as readonly number[]).includes(value)
    ? value
    : DEFAULT_PATIENT_PAGE_SIZE;
}

export function parsePage(raw: string | undefined): number {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : 1;
}
