import { BrowserFrame } from "@/components/marketing/BrowserFrame";

export function ReceiptPreview() {
  return (
    <BrowserFrame path="/financeiro/recibo">
      <div className="mx-auto max-w-[220px] rounded-xl border border-border bg-background p-4 text-center">
        <p className="font-heading text-base font-semibold">Clínica Bella Estética</p>
        <p className="text-[10px] text-muted-foreground">Rua das Flores, 120, São Paulo, SP</p>
        <div className="my-3 h-px bg-border" />
        <p className="text-xs text-muted-foreground">Recibo de pagamento</p>
        <p className="mt-1 font-heading text-xl font-semibold text-primary">R$ 350,00</p>
        <p className="mt-1 text-[11px] text-muted-foreground">Mariana Costa Silva · Limpeza de pele</p>
      </div>
    </BrowserFrame>
  );
}
