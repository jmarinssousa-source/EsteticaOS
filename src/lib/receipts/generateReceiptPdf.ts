import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { formatCurrency } from "@/lib/format";
import { SYSTEM_NAME, VENDOR_FOOTER } from "@/lib/brand";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/financeiro/constants";

const PRIMARY = rgb(0.701, 0.216, 0.213);
const GRAY = rgb(0.42, 0.42, 0.42);
const BLACK = rgb(0.1, 0.1, 0.1);
const FAINT = rgb(0.62, 0.62, 0.62);

const PAGE_WIDTH = 420;
/** Altura mínima; cresce se a descrição quebrar em muitas linhas. */
const MIN_PAGE_HEIGHT = 420;
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


/** Rodapé de marca: nome do sistema e assinatura discreta da Orbyniq. */
function drawBrandFooter(
  page: PDFPage,
  font: PDFFont,
  clinicName: string,
  pageWidth: number,
) {
  const clinicLine = `${clinicName} · ${new Date().toLocaleDateString("pt-BR")}`;
  const clinicWidth = font.widthOfTextAtSize(clinicLine, 9);
  page.drawText(clinicLine, {
    x: (pageWidth - clinicWidth) / 2,
    y: 40,
    size: 9,
    font,
    color: GRAY,
  });

  const vendorWidth = font.widthOfTextAtSize(VENDOR_FOOTER, 6.5);
  page.drawText(VENDOR_FOOTER, {
    x: (pageWidth - vendorWidth) / 2,
    y: 26,
    size: 6.5,
    font,
    color: FAINT,
  });
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
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const bodyText = data.patient
    ? `Recebemos de ${data.patient.name}${data.patient.cpf ? ` (CPF ${data.patient.cpf})` : ""} a importância de ${formatCurrency(data.amount)} referente a: ${data.description}.`
    : `Recebemos a importância de ${formatCurrency(data.amount)} referente a: ${data.description}.`;
  const bodyLines = wrapText(bodyText, font, 11, CONTENT_WIDTH);

  // Cabeçalho + título + corpo + duas linhas de pagamento + rodapé.
  const pageHeight = Math.max(MIN_PAGE_HEIGHT, 260 + bodyLines.length * 16);
  const page = doc.addPage([PAGE_WIDTH, pageHeight]);

  let y = pageHeight - 50;

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

  const systemWidth = font.widthOfTextAtSize(SYSTEM_NAME, 7);
  page.drawText(SYSTEM_NAME, {
    x: PAGE_WIDTH - MARGIN - systemWidth,
    y,
    size: 7,
    font,
    color: FAINT,
  });
  y -= 34;

  for (const line of bodyLines) {
    page.drawText(line, { x: MARGIN, y, size: 11, font, color: BLACK });
    y -= 16;
  }

  y -= 10;
  const methodLabel = data.paymentMethod ? PAYMENT_METHOD_LABELS[data.paymentMethod] : "Não informada";
  page.drawText(`Forma de pagamento: ${methodLabel}`, { x: MARGIN, y, size: 10, font, color: GRAY });
  y -= 16;

  const dateLabel = data.paymentDate ? new Date(data.paymentDate).toLocaleDateString("pt-BR") : "—";
  page.drawText(`Data do pagamento: ${dateLabel}`, { x: MARGIN, y, size: 10, font, color: GRAY });

  drawBrandFooter(page, font, data.clinic.name, PAGE_WIDTH);

  return doc.save();
}
