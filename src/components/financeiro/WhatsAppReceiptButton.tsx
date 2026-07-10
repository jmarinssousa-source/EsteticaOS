"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function WhatsAppReceiptButton({
  clinicName,
  patientName,
  amount,
  paymentDate,
  patientPhone,
}: {
  clinicName: string;
  patientName: string | null;
  amount: number;
  paymentDate: string | null;
  patientPhone: string | null;
}) {
  function handleSend() {
    const message = [
      `Recibo — ${clinicName}`,
      patientName ? `Paciente: ${patientName}` : null,
      `Valor: ${formatCurrency(amount)}`,
      paymentDate ? `Data: ${new Date(paymentDate).toLocaleDateString("pt-BR")}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    window.open(buildWhatsAppUrl(patientPhone, message), "_blank");
  }

  return (
    <Button variant="outline" className="print:hidden" onClick={handleSend}>
      <MessageCircle className="size-4" />
      Enviar para WhatsApp
    </Button>
  );
}
