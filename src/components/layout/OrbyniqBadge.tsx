import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const SUPPORT_WHATSAPP_URL = "https://wa.me/5521971925107";
const SUPPORT_WHATSAPP_LABEL = "(21) 97192-5107";

export function OrbyniqBadge({
  showSupport = true,
  className,
}: {
  showSupport?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1 text-[11px] text-muted-foreground", className)}>
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
        Uma solução Orbyniq
      </span>
      {showSupport && (
        <a
          href={SUPPORT_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          title="Suporte Orbyniq via WhatsApp"
          className="flex items-center gap-1 hover:text-primary"
        >
          <MessageCircle className="size-3" />
          Suporte Orbyniq: {SUPPORT_WHATSAPP_LABEL}
        </a>
      )}
    </div>
  );
}
