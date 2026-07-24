"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Download, MessageCircle, Printer } from "lucide-react";
import { getBudgetPdfUrl } from "@/actions/receipts";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";

export function BudgetPdfActions({
  budgetId,
  clinicName,
  patientName,
  patientPhone,
  total,
}: {
  budgetId: string;
  clinicName: string;
  patientName: string | null;
  patientPhone: string | null;
  total: number;
}) {
  const [isDownloading, startDownload] = useTransition();
  const [isSharing, startShare] = useTransition();

  function handleDownload() {
    const tab = window.open("", "_blank");
    startDownload(async () => {
      const result = await getBudgetPdfUrl(budgetId);
      if ("error" in result) {
        toast.error(result.error);
        tab?.close();
        return;
      }
      if (tab) tab.location.href = result.url;
      else window.open(result.url, "_blank");
    });
  }

  function handleShare() {
    const tab = window.open("", "_blank");
    startShare(async () => {
      const result = await getBudgetPdfUrl(budgetId);
      if ("error" in result) {
        toast.error(result.error);
        tab?.close();
        return;
      }

      const message = [
        `Orçamento — ${clinicName}`,
        patientName ? `Paciente: ${patientName}` : null,
        `Total: ${formatCurrency(total)}`,
        `PDF do orçamento: ${result.url}`,
      ]
        .filter(Boolean)
        .join("\n");

      const url = buildWhatsAppUrl(patientPhone, message);
      if (tab) tab.location.href = url;
      else window.open(url, "_blank");
    });
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button variant="outline" onClick={() => window.print()}>
        <Printer className="size-4" />
        Imprimir
      </Button>
      <Button variant="outline" onClick={handleDownload} disabled={isDownloading}>
        <Download className="size-4" />
        {isDownloading ? "Gerando PDF..." : "Baixar PDF"}
      </Button>
      <Button variant="outline" onClick={handleShare} disabled={isSharing}>
        <MessageCircle className="size-4" />
        {isSharing ? "Gerando PDF..." : "Enviar por WhatsApp"}
      </Button>
    </div>
  );
}
