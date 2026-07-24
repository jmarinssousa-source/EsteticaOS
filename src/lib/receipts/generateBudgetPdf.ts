import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { formatCurrency } from "@/lib/format";

const PRIMARY = rgb(0.701, 0.216, 0.213);
const GRAY = rgb(0.42, 0.42, 0.42);
const BLACK = rgb(0.1, 0.1, 0.1);
const LINE = rgb(0.85, 0.85, 0.85);

const PAGE_WIDTH = 420;
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const ROW_HEIGHT = 16;

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export type BudgetPdfItem = {
  label: string;
  quantity: number;
  unitPrice: number;
  discount: number;
};

export type BudgetPdfData = {
  clinic: { name: string; address: string | null; phone: string | null; cnpj: string | null };
  patient: { name: string; cpf: string | null } | null;
  items: BudgetPdfItem[];
  discount: number;
  total: number;
  createdAt: string;
  notes: string | null;
};

export async function generateBudgetPdf(data: BudgetPdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Height grows with the item count and any wrapped notes, so the page is
  // sized after computing content instead of a fixed guess.
  const notesLines = data.notes ? wrapText(data.notes, font, 9, CONTENT_WIDTH) : [];
  const estimatedHeight = 300 + data.items.length * ROW_HEIGHT + notesLines.length * 12;
  const page = doc.addPage([PAGE_WIDTH, estimatedHeight]);

  let y = estimatedHeight - 50;

  page.drawText(data.clinic.name, { x: MARGIN, y, size: 18, font: bold, color: BLACK });
  y -= 20;

  if (data.clinic.address) {
    page.drawText(data.clinic.address, { x: MARGIN, y, size: 9, font, color: GRAY });
    y -= 13;
  }
  const contactLine = [data.clinic.phone, data.clinic.cnpj ? `CNPJ: ${data.clinic.cnpj}` : null]
    .filter(Boolean)
    .join("  ·  ");
  if (contactLine) {
    page.drawText(contactLine, { x: MARGIN, y, size: 9, font, color: GRAY });
    y -= 13;
  }

  y -= 6;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 2, color: PRIMARY });
  y -= 34;

  const title = "ORÇAMENTO";
  const titleWidth = bold.widthOfTextAtSize(title, 14);
  page.drawText(title, { x: (PAGE_WIDTH - titleWidth) / 2, y, size: 14, font: bold, color: BLACK });
  y -= 28;

  if (data.patient) {
    const patientLine = `Paciente: ${data.patient.name}${data.patient.cpf ? ` (CPF ${data.patient.cpf})` : ""}`;
    page.drawText(patientLine, { x: MARGIN, y, size: 10, font, color: BLACK });
    y -= 14;
  }
  page.drawText(`Data: ${new Date(data.createdAt).toLocaleDateString("pt-BR")}`, {
    x: MARGIN,
    y,
    size: 9,
    font,
    color: GRAY,
  });
  y -= 24;

  page.drawText("Item", { x: MARGIN, y, size: 9, font: bold, color: GRAY });
  page.drawText("Qtd.", { x: MARGIN + 210, y, size: 9, font: bold, color: GRAY });
  page.drawText("Unit.", { x: MARGIN + 255, y, size: 9, font: bold, color: GRAY });
  page.drawText("Subtotal", { x: MARGIN + 320, y, size: 9, font: bold, color: GRAY });
  y -= 8;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 1, color: LINE });
  y -= 16;

  for (const item of data.items) {
    const subtotal = item.quantity * item.unitPrice - item.discount;
    const label = wrapText(item.label, font, 9, 195)[0] ?? item.label;
    page.drawText(label, { x: MARGIN, y, size: 9, font, color: BLACK });
    page.drawText(String(item.quantity), { x: MARGIN + 210, y, size: 9, font, color: BLACK });
    page.drawText(formatCurrency(item.unitPrice), { x: MARGIN + 255, y, size: 9, font, color: BLACK });
    page.drawText(formatCurrency(subtotal), { x: MARGIN + 320, y, size: 9, font, color: BLACK });
    y -= ROW_HEIGHT;
  }

  y -= 6;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 1, color: LINE });
  y -= 18;

  if (data.discount > 0) {
    page.drawText(`Desconto geral: ${formatCurrency(data.discount)}`, {
      x: MARGIN,
      y,
      size: 9,
      font,
      color: GRAY,
    });
    y -= 16;
  }

  page.drawText(`Total: ${formatCurrency(data.total)}`, { x: MARGIN, y, size: 12, font: bold, color: BLACK });
  y -= 24;

  if (notesLines.length > 0) {
    page.drawText("Observações:", { x: MARGIN, y, size: 9, font: bold, color: GRAY });
    y -= 12;
    for (const line of notesLines) {
      page.drawText(line, { x: MARGIN, y, size: 9, font, color: GRAY });
      y -= 12;
    }
  }

  const footer = `${data.clinic.name} · ${new Date().toLocaleDateString("pt-BR")}`;
  const footerWidth = font.widthOfTextAtSize(footer, 9);
  page.drawText(footer, { x: (PAGE_WIDTH - footerWidth) / 2, y: 30, size: 9, font, color: GRAY });

  return doc.save();
}
