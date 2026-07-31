import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUPPORT_WHATSAPP_LABEL, SUPPORT_WHATSAPP_URL, VENDOR_LINE } from "@/lib/brand";

export { SUPPORT_WHATSAPP_LABEL, SUPPORT_WHATSAPP_URL };

export function OrbyniqBadge({
  showSupport = true,
  className,
}: {
  showSupport?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1 text-[11px] text-muted-foreground", className)}>
      {/* Sem o /80: com a opacidade a linha ficava em 3.6:1 sobre o
          fundo, abaixo do mínimo AA para texto pequeno. */}
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {VENDOR_LINE}
      </span>
      {showSupport && (
        <a
          href={SUPPORT_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          title="Suporte Orbyniq via WhatsApp"
          // `min-h-11` porque é um link solto, não dentro de uma frase:
          // vale a regra do alvo de toque de 44px.
          className="flex min-h-11 items-center gap-1 hover:text-primary"
        >
          <MessageCircle className="size-3" />
          Suporte Orbyniq: {SUPPORT_WHATSAPP_LABEL}
        </a>
      )}
    </div>
  );
}
