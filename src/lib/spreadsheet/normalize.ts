import { formatCpf, formatPhone } from "@/lib/format/masks";

/**
 * Conversores para dados que chegam de planilha. A clínica não deveria
 * ter de arrumar o arquivo antes de importar: telefone com ou sem
 * máscara, CPF com ou sem ponto, data em dd/mm/aaaa ou aaaa-mm-dd,
 * valor com vírgula ou ponto — tudo entra e sai no padrão do sistema.
 */

/** Telefone em qualquer formato → "(11) 99999-0000". */
export function normalizePhoneInput(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  // Zero de operadora ("011 3333-4444"): nenhum DDD começa com zero, então
  // é sempre seguro tirar — e tem de ser antes de medir o tamanho, senão
  // um fixo de 10 dígitos passa por celular de 11.
  digits = digits.replace(/^0+/, "");
  // Código do país. Só remove quando sobra número demais: 55 também é DDD
  // válido (Santa Maria/RS), e "55 3333-4444" tem de continuar DDD 55.
  if (digits.length > 11 && digits.startsWith("55")) digits = digits.slice(2);

  // Fora de 10/11 dígitos não é telefone brasileiro reconhecível: guarda
  // como veio, para a pessoa ver e corrigir, em vez de gravar errado.
  if (digits.length !== 10 && digits.length !== 11) return raw.trim() || null;

  return formatPhone(digits);
}

/** CPF em qualquer formato → "123.456.789-00". */
export function normalizeCpfInput(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  // Excel trata CPF como número e come o zero à esquerda: "01234567890"
  // volta como 1234567890. Recompõe os 11 dígitos.
  const padded = digits.length >= 8 && digits.length < 11 ? digits.padStart(11, "0") : digits;
  if (padded.length !== 11) return raw.trim() || null;

  return formatCpf(padded);
}

/**
 * Data em dd/mm/aaaa, dd-mm-aaaa, aaaa-mm-dd ou aaaa/mm/dd → "aaaa-mm-dd".
 * Devolve null quando não dá para entender, para a linha ser recusada
 * com uma mensagem em vez de gravar data errada.
 */
export function normalizeDateInput(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  // O leitor de .xlsx já entrega datas em ISO, às vezes com hora.
  const iso = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ]\d{2}:\d{2}.*)?$/);
  if (iso) return buildDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const isoSlash = value.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (isoSlash) return buildDate(Number(isoSlash[1]), Number(isoSlash[2]), Number(isoSlash[3]));

  const brazilian = value.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/);
  if (brazilian) {
    const year = Number(brazilian[3]);
    // Ano de dois dígitos: 30 para baixo é 20xx, acima é 19xx — cobre
    // nascimento de paciente e data de atendimento sem ambiguidade prática.
    const fullYear = brazilian[3].length === 2 ? (year <= 30 ? 2000 + year : 1900 + year) : year;
    return buildDate(fullYear, Number(brazilian[2]), Number(brazilian[1]));
  }

  return null;
}

function buildDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (year < 1900 || year > 2200) return null;

  const date = new Date(Date.UTC(year, month - 1, day));
  // Rejeita 31/02 e afins: o Date "conserta" e viraria 03/03.
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Hora em "14:00", "14h", "14h30", "9:5" ou fração do Excel → "14:00". */
export function normalizeTimeInput(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  const separated = value.match(/^(\d{1,2})\s*[:h.]\s*(\d{0,2})/i);
  if (separated) {
    const hours = Number(separated[1]);
    const minutes = Number(separated[2].padEnd(2, "0") || "0");
    if (hours > 23 || minutes > 59) return null;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  const plain = value.match(/^(\d{1,2})$/);
  if (plain) {
    const hours = Number(plain[1]);
    return hours <= 23 ? `${String(hours).padStart(2, "0")}:00` : null;
  }

  return null;
}

/**
 * Valor em "R$ 1.234,56", "1.234,56", "1234.56", "1234" → 1234.56.
 * A regra do separador segue o uso brasileiro: se há vírgula, ela é o
 * decimal e o ponto é milhar; sem vírgula, um ponto seguido de
 * exatamente três dígitos também é milhar ("1.500" é mil e quinhentos,
 * não um e meio).
 */
export function normalizeAmountInput(raw: string): number | null {
  const value = raw.replace(/[R$\s]/gi, "").trim();
  if (!value) return null;

  let normalized: string;

  if (value.includes(",")) {
    normalized = value.replace(/\./g, "").replace(",", ".");
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(value)) {
    normalized = value.replace(/\./g, "");
  } else {
    normalized = value;
  }

  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
}
