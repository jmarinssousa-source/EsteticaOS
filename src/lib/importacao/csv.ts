// Minimal RFC 4180-ish CSV parser/generator — no library, mirrors the
// zero-dependency stance already used for report exports
// (src/lib/relatorios/export.ts). Handles quoted fields (with embedded
// commas, quotes, and newlines) and both CRLF/LF line endings.

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const source = text.replace(/^﻿/, ""); // strip BOM if present

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    const next = source[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\r") {
      // handled by \n
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/**
 * Neutraliza célula que a planilha leria como fórmula.
 *
 * Excel, Google Sheets e LibreOffice tratam qualquer célula começada por
 * `=`, `+`, `-` ou `@` como fórmula — e algumas delas chamam programa
 * externo. Como o conteúdo exportado é digitado pelas pessoas da clínica
 * (nome do paciente, observação do prontuário, descrição de despesa),
 * basta alguém escrever `=HYPERLINK(...)` num campo para que o arquivo
 * baixado por outra pessoa vire ataque quando aberto.
 *
 * O aspas simples na frente é a solução padrão: a planilha passa a ler a
 * célula como texto e não mostra o caractere extra.
 */
function neutralizeFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function toCsvField(value: string) {
  const safe = neutralizeFormula(value);
  if (safe.includes(",") || safe.includes('"') || safe.includes("\n") || safe !== value) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function generateCsv(rows: string[][]): string {
  return rows.map((row) => row.map(toCsvField).join(",")).join("\r\n");
}

/** Maps a header row to column index, case/accent-insensitive and
 * tolerant of extra whitespace — spreadsheets round-tripped through
 * Excel/Sheets often normalize headers slightly. */
export function indexColumns(headerRow: string[]): Record<string, number> {
  const COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");
  const normalize = (s: string) =>
    s.trim().toLowerCase().normalize("NFD").replace(COMBINING_MARKS, "");

  const map: Record<string, number> = {};
  headerRow.forEach((header, index) => {
    map[normalize(header)] = index;
  });
  return map;
}
