// Zero-dependency exports: CSV is plain text; "Excel" is an HTML table
// served with an .xls extension and the ms-excel MIME type, a well
// known trick that Excel opens natively with real cells/columns —
// avoids pulling in a spreadsheet library (xlsx/sheetjs) for what the
// PRD only asks as a secondary export format. PDF export is out of
// MVP scope entirely (PRD 10.14) except the recibo, which uses the
// print-to-PDF pattern instead (see [[project-estheticaos-stack]]).

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

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function downloadExcel(filename: string, headers: string[], rows: (string | number)[][]) {
  const headerHtml = `<tr>${headers.map((h) => `<th>${escapeHtml(String(h))}</th>`).join("")}</tr>`;
  const rowsHtml = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(String(cell))}</td>`).join("")}</tr>`)
    .join("");
  const html = `<html><head><meta charset="UTF-8" /></head><body><table>${headerHtml}${rowsHtml}</table></body></html>`;
  triggerDownload(new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" }), `${filename}.xls`);
}
