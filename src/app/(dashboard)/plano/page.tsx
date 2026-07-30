import { Check, MessageCircle } from "lucide-react";
import { getClinicPlan, requirePermission } from "@/lib/auth/session";
import { describeTrial, TRIAL_DAYS } from "@/lib/plan/trial";
import { supportWhatsAppUrl } from "@/lib/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Plano — EstéticaOS" };

const INCLUDED = [
  "Agenda por profissional, com cores e filtros",
  "Prontuário com fotos, anamnese e termos assinados",
  "Financeiro com contas a pagar, a receber e comissões",
  "CRM de leads, do primeiro contato ao fechamento",
  "Estoque com alerta de mínimo e validade",
  "Relatórios de faturamento e desempenho",
  "Importação e exportação em Excel ou CSV",
  "Usuários ilimitados, cada um com sua permissão",
];

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function PlanoPage() {
  await requirePermission("settings_access");
  const plan = await getClinicPlan();
  const endsAt = formatDate(plan.trialEndsAt);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plano</h1>
        <p className="text-sm text-muted-foreground">
          Situação da sua assinatura do EstéticaOS.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle>{describeTrial(plan)}</CardTitle>
            <Badge variant={plan.expired ? "destructive" : "default"}>
              {plan.neverExpires
                ? "Sem prazo"
                : plan.status === "active"
                  ? "Assinatura ativa"
                  : plan.expired
                    ? "Teste vencido"
                    : "Em teste"}
            </Badge>
          </div>
          <CardDescription>
            {plan.neverExpires
              ? "Esta clínica está marcada como acesso permanente e não é afetada pelo prazo de teste."
              : plan.status === "active"
                ? "Todos os recursos liberados, sem data de corte."
                : endsAt
                  ? `Seu teste de ${TRIAL_DAYS} dias vai até ${endsAt}.`
                  : `Teste grátis de ${TRIAL_DAYS} dias.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">O que está incluído</p>
            <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {!plan.neverExpires && plan.status !== "active" && (
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-sm font-medium">Quer continuar depois do teste?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Fale com a gente pelo WhatsApp para ativar sua assinatura. Seus dados ficam do jeito
                que estão — nada é apagado quando o teste vence.
              </p>
              <Button
                className="mt-3"
                nativeButton={false}
                render={
                  <a
                    href={supportWhatsAppUrl("Quero ativar o plano do EstéticaOS.")}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <MessageCircle className="size-4" />
                Falar com a gente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
