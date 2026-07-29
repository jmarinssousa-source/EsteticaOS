import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Volta para o painel com todos os ícones de configurações. */
export function SettingsBackLink() {
  return (
    <Link
      href="/configuracoes"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground print:hidden"
    >
      <ArrowLeft className="size-4" />
      Configurações
    </Link>
  );
}
