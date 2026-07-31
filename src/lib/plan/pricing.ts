/**
 * A oferta comercial do EstéticaOS, num lugar só.
 *
 * Preço mora aqui em centavos porque é assim que provedor de pagamento
 * trabalha, e porque conta em real com casa decimal em ponto flutuante
 * erra na hora de somar. Quem precisa mostrar usa os `format*` daqui, e
 * ninguém escreve "R$ 217" na mão em componente nenhum: preço repetido
 * à mão em cinco arquivos é preço que fica desatualizado em quatro.
 *
 * A landing, a tela de Plano, a metadata e o JSON-LD leem tudo daqui.
 */

export const PLAN_NAME = "EstéticaOS Completo";

export const PLAN_MONTHLY_PRICE_CENTS = 21_700;
export const PLAN_YEARLY_PRICE_CENTS = 199_700;
/** Quanto sai por mês quem paga o ano inteiro de uma vez. */
export const PLAN_YEARLY_EQUIVALENT_CENTS = 16_700;
/** Doze meses no mensal menos o anual: 12 × 21700 − 199700 = 60700. */
export const PLAN_YEARLY_SAVINGS_CENTS =
  PLAN_MONTHLY_PRICE_CENTS * 12 - PLAN_YEARLY_PRICE_CENTS;

export type BillingCycle = "monthly" | "yearly";

export function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
}

/** Preço com o período junto, do jeito que aparece no botão e no card. */
export function formatCycle(cycle: BillingCycle): string {
  return cycle === "monthly"
    ? `${formatPrice(PLAN_MONTHLY_PRICE_CENTS)}/mês`
    : `${formatPrice(PLAN_YEARLY_EQUIVALENT_CENTS)}/mês`;
}

/**
 * O que está incluído, na ordem em que faz sentido para quem lê: primeiro
 * o que tira o medo de crescer, depois os módulos.
 *
 * Cada linha tem tela correspondente no sistema. Nada aqui é promessa de
 * roadmap.
 */
export const PLAN_FEATURES = [
  "Profissionais ilimitados",
  "Pacientes ilimitados",
  "Todos os módulos liberados",
  "Agenda por profissional",
  "Prontuário da paciente",
  "Anamnese digital",
  "Termos e assinaturas",
  "Fotos de evolução",
  "CRM de leads",
  "Orçamentos e vendas",
  "Financeiro e comissões",
  "Estoque com alertas",
  "Relatórios",
  "Importação de planilha",
  "Exportação em Excel ou CSV",
];
