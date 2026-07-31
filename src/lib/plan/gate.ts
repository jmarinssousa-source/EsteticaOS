import "server-only";
import { headers } from "next/headers";
import { PATHNAME_HEADER } from "@/proxy";
import type { ClinicPlan } from "@/lib/plan/trial";

/**
 * Onde a pessoa ainda pode ir quando o teste venceu.
 *
 * A conta continua existindo e nenhum dado é apagado: o que trava é a
 * operação do dia a dia. Fica de pé só o caminho para resolver a
 * situação (ativar o plano) e para sair.
 *
 * Login, cadastro, recuperação de senha e as páginas de token do
 * paciente (anamnese e termo) vivem fora do painel e nem passam por
 * aqui, então continuam abertas de qualquer jeito. Isso é de propósito:
 * a paciente que recebeu um link de anamnese não pode ficar sem
 * responder porque a assinatura da clínica venceu.
 */
export const ALLOWED_WHEN_BLOCKED = ["/plano"];

export function isAllowedWhenBlocked(pathname: string): boolean {
  return ALLOWED_WHEN_BLOCKED.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/** Rota pedida nesta requisição, carimbada pelo proxy. */
export async function currentPathname(): Promise<string> {
  return (await headers()).get(PATHNAME_HEADER) ?? "";
}

/**
 * Esta requisição deve ser barrada?
 *
 * Devolve `false` quando não dá para saber a rota: sem o cabeçalho, o
 * certo é deixar passar em vez de trancar a pessoa numa tela em branco.
 * O bloqueio precisa ser confiável, não zeloso.
 */
export async function shouldBlock(plan: ClinicPlan): Promise<boolean> {
  if (!plan.blocked) return false;
  const pathname = await currentPathname();
  if (!pathname) return false;
  return !isAllowedWhenBlocked(pathname);
}
