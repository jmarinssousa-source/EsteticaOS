import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { formatCurrency } from "@/lib/format";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/financeiro/constants";

const PRIMARY = rgb(0.701, 0.216, 0.213);
const GRAY = rgb(0.42, 0.42, 0.42);
const BLACK = rgb(0.1, 0.1, 0.1);

const PAGE_WIDTH = 420;
const PAGE_HEIGHT = 560;
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

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

export type ReceiptPdfData = {
  clinic: { name: string; address: string | null; phone: string | null; cnpj: string | null };
  patient: { name: string; cpf: string | null } | null;
  amount: number;
  description: string;
  paymentMethod: PaymentMethod | null;
  paymentDate: string | null;
};

export async function generateReceiptPdf(data: ReceiptPdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let y = PAGE_HEIGHT - 50;

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

  const title = "RECIBO";
  const titleWidth = bold.widthOfTextAtSize(title, 14);
  page.drawText(title, { x: (PAGE_WIDTH - titleWidth) / 2, y, size: 14, font: bold, color: BLACK });
  y -= 34;

  const bodyText = data.patient
    ? `Recebemos de ${data.patient.name}${data.patient.cpf ? ` (CPF ${data.patient.cpf})` : ""} a importância de ${formatCurrency(data.amount)} referente a: ${data.description}.`
    : `Recebemos a importância de ${formatCurrency(data.amount)} referente a: ${data.description}.`;

  for (const line of wrapText(bodyText, font, 11, CONTENT_WIDTH)) {
    page.drawText(line, { x: MARGIN, y, size: 11, font, color: BLACK });
    y -= 16;
  }

  y -= 10;
  const methodLabel = data.paymentMethod ? PAYMENT_METHOD_LABELS[data.paymentMethod] : "Não informada";
  page.drawText(`Forma de pagamento: ${methodLabel}`, { x: MARGIN, y, size: 10, font, color: GRAY });
  y -= 16;

  const dateLabel = data.paymentDate ? new Date(data.paymentDate).toLocaleDateString("pt-BR") : "—";
  page.drawText(`Data do pagamento: ${dateLabel}`, { x: MARGIN, y, size: 10, font, color: GRAY });

  const footer = `${data.clinic.name} · ${new Date().toLocaleDateString("pt-BR")}`;
  const footerWidth = font.widthOfTextAtSize(footer, 9);
  page.drawText(footer, { x: (PAGE_WIDTH - footerWidth) / 2, y: 40, size: 9, font, color: GRAY });

  return doc.save();
}
