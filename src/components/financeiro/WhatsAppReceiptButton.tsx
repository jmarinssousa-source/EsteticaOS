"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { getReceiptPdfUrl } from "@/actions/receipts";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";

export function WhatsAppReceiptButton({
  entryId,
  clinicName,
  patientName,
  amount,
  patientPhone,
}: {
  entryId: string;
  clinicName: string;
  patientName: string | null;
  amount: number;
  patientPhone: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSend() {
    // Open the tab synchronously (before the await) so browsers still treat
    // it as a direct result of the click, not a blocked popup.
    const tab = window.open("", "_blank");

    startTransition(async () => {
      const result = await getReceiptPdfUrl(entryId);
      if ("error" in result) {
        toast.error(result.error);
        tab?.close();
        return;
      }

      const message = [
        `Recibo — ${clinicName}`,
        patientName ? `Paciente: ${patientName}` : null,
        `Valor: ${formatCurrency(amount)}`,
        `PDF do recibo: ${result.url}`,
      ]
        .filter(Boolean)
        .join("\n");

      const url = buildWhatsAppUrl(patientPhone, message);
      if (tab) tab.location.href = url;
      else window.open(url, "_blank");
    });
  }

  return (
    <Button variant="outline" className="print:hidden" onClick={handleSend} disabled={isPending}>
      <MessageCircle className="size-4" />
      {isPending ? "Gerando PDF..." : "Enviar para WhatsApp"}
    </Button>
  );
}
