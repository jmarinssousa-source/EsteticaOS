// Exportações do lado do navegador. CSV é texto puro; o Excel é um
// .xlsx de verdade, montado em src/lib/spreadsheet/xlsx.ts sobre o
// JSZip — antes era uma tabela HTML renomeada para .xls, que abria mas
// fazia o Excel reclamar de "formato diferente da extensão" e não
// preservava tipo de célula. O JSZip entra por import dinâmico para não
// pesar no pacote de quem nunca exporta.

function toCsvValue(value: string | number) {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const lines = [headers, ...rows].map((row) => row.map(toCsvValue).join(","));
  // Leading BOM so Excel opens UTF-8 accented characters correctly.
  const csv = `﻿${lines.join("\r\n")}`;
  triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `${filename}.csv`);
}

export async function downloadExcel(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
) {
  const { buildXlsx } = await import("@/lib/spreadsheet/xlsx");
  const bytes = await buildXlsx({ headers, rows });

  triggerDownload(
    new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${filename}.xlsx`,
  );
}
