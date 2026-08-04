import type { LeadStatus, StageRole } from "@/lib/crm/constants";

/**
 * A transição de um lead entre colunas do funil, num lugar só.
 *
 * ## Por que existe
 *
 * Havia três caminhos para a mesma coisa, e cada um fazia um pedaço
 * diferente:
 *
 * | | move a coluna | muda o status | cria paciente | `last_moved_at` |
 * |---|---|---|---|---|
 * | arrastar o card | sim | sim | sim | sim |
 * | botão "Converter em paciente" | **não** | sim | sim | **não** |
 * | botão "Marcar como perdido" | **não** | sim | — | **não** |
 *
 * Na tela isso aparecia assim: quem clicava no botão via o card ganhar a
 * etiqueta "Convertido em paciente" e **continuar parado** na coluna onde
 * estava — "Em atendimento", "Orçamento enviado", onde fosse. Quem
 * arrastava o mesmo lead para "Fechado" via ele ir para o lugar certo. O
 * quadro passava a contar duas histórias diferentes do mesmo funil, e o
 * contador de "lead parado" nunca zerava para quem usava os botões.
 *
 * Agora os três caminhos entram por aqui.
 *
 * ## Por que a coluna é achada pelo papel, não pelo nome
 *
 * A clínica renomeia coluna. "Fechado" vira "Cliente", "Perdido" vira
 * "Não seguiu". Comparar o nome faria a automação parar de funcionar no
 * dia da renomeação, em silêncio. O papel (`role`) é campo de estrutura,
 * escrito na migração 0014, e sobrevive a qualquer nome.
 *
 * ## Como isto evita estado pela metade
 *
 * Criar paciente e atualizar o lead são duas escritas, e não há
 * transação entre elas. A ordem foi escolhida para que uma falha no meio
 * seja **recuperável repetindo a operação**, nunca duplicadora:
 *
 * 1. procura um paciente que já pertença a este lead;
 * 2. só cria se não existir;
 * 3. depois atualiza o lead apontando para ele.
 *
 * Se o passo 3 falhar, o paciente fica lá sozinho e o lead continua
 * aberto. Repetir a conversão acha o paciente do passo 1, não cria outro,
 * e termina o serviço. O contrário — atualizar o lead primeiro — deixaria
 * um lead "convertido" sem paciente nenhum, e aí repetir não consertaria:
 * o próprio status barraria a segunda tentativa.
 *
 * A trava definitiva contra duplicata é o índice único de
 * `patients(lead_id)`, na migração 0021. Este arquivo é a primeira
 * barreira; o banco é a última.
 */

export type LeadRow = {
  id: string;
  status: LeadStatus;
  stage_id: string;
  patient_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  origin: string;
  notes: string | null;
};

export type StageRow = {
  id: string;
  role: StageRole | null;
};

export type LeadPatch = {
  stage_id: string;
  status: LeadStatus;
  patient_id: string | null;
  last_moved_at: string;
};

/**
 * O acesso ao banco de que a transição precisa.
 *
 * Toda implementação nasce presa a uma clínica e filtra por ela em cada
 * consulta. É o que faz o isolamento entre clínicas ser propriedade do
 * objeto, e não algo que cada chamada precise lembrar de repetir: um lead
 * de outra clínica simplesmente não é encontrado.
 */
export type CrmStore = {
  findLead(leadId: string): Promise<LeadRow | null>;
  findStage(stageId: string): Promise<StageRow | null>;
  findStageByRole(role: StageRole): Promise<StageRow | null>;
  /** Paciente já criado a partir deste lead, se houver. */
  findPatientByLead(leadId: string): Promise<string | null>;
  createPatient(lead: LeadRow): Promise<string | null>;
  saveLead(leadId: string, patch: LeadPatch): Promise<boolean>;
};

export type TransitionResult =
  | {
      ok: true;
      status: LeadStatus;
      stageId: string;
      patientId: string | null;
      /** Um cadastro novo nasceu agora (para a tela avisar). */
      createdPatient: boolean;
    }
  | { ok: false; error: string };

export const SEM_COLUNA_WON =
  'Nenhuma coluna do funil está marcada como "Converte em paciente". Recrie a coluna Fechado ou fale com o suporte — nada foi alterado neste lead.';

export const SEM_COLUNA_LOST =
  'Nenhuma coluna do funil está marcada como "Marca como perdido". Recrie a coluna Perdido ou fale com o suporte — nada foi alterado neste lead.';

/**
 * Que status o lead passa a ter ao entrar nesta coluna.
 *
 * A regra que não é óbvia: sair da coluna de fechamento **não** desfaz a
 * conversão. O paciente já existe, com agenda, prontuário e financeiro
 * pendurados nele — arrastar um card de volta não pode apagar isso. Um
 * lead perdido, esse sim, reabre ao voltar para uma coluna comum: ali não
 * há nada criado para desfazer.
 */
export function nextLeadStatus(role: StageRole | null, current: LeadStatus): LeadStatus {
  if (role === "won") return "converted";
  if (role === "lost") return "lost";
  return current === "lost" ? "open" : current;
}

async function applyTransition(
  store: CrmStore,
  lead: LeadRow,
  stage: StageRow,
  agora: () => string,
): Promise<TransitionResult> {
  const status = nextLeadStatus(stage.role, lead.status);

  let patientId = lead.patient_id;
  let createdPatient = false;

  if (status === "converted") {
    // Duas defesas contra converter duas vezes: o vínculo já gravado no
    // lead e, se ele se perdeu no meio de uma tentativa anterior, o
    // paciente que ficou órfão apontando para este lead.
    if (!patientId) patientId = await store.findPatientByLead(lead.id);

    if (!patientId) {
      patientId = await store.createPatient(lead);
      if (!patientId) return { ok: false, error: "Não foi possível criar o paciente." };
      createdPatient = true;
    }
  }

  const salvou = await store.saveLead(lead.id, {
    stage_id: stage.id,
    status,
    patient_id: patientId,
    last_moved_at: agora(),
  });

  if (!salvou) {
    return {
      ok: false,
      error: createdPatient
        ? "O paciente foi criado, mas o lead não pôde ser atualizado. Tente converter de novo — o cadastro não será duplicado."
        : "Não foi possível mover o lead.",
    };
  }

  return { ok: true, status, stageId: stage.id, patientId, createdPatient };
}

/** Move para uma coluna escolhida na tela (arrastar, ou o seletor do card). */
export async function moveLeadToStage(
  store: CrmStore,
  leadId: string,
  stageId: string,
  agora: () => string = () => new Date().toISOString(),
): Promise<TransitionResult> {
  // Os dois vêm do navegador, então os dois são conferidos contra a
  // clínica antes de qualquer escrita.
  const [lead, stage] = await Promise.all([store.findLead(leadId), store.findStage(stageId)]);

  if (!lead) return { ok: false, error: "Lead não encontrado." };
  if (!stage) return { ok: false, error: "Coluna não encontrada." };

  return applyTransition(store, lead, stage, agora);
}

/**
 * Move para a coluna que cumpre um papel — o caminho dos botões.
 *
 * O navegador manda só o lead e a intenção ("converter", "marcar como
 * perdido"). Qual coluna corresponde a isso é decidido aqui, pelo `role`.
 */
export async function moveLeadToRole(
  store: CrmStore,
  leadId: string,
  role: StageRole,
  agora: () => string = () => new Date().toISOString(),
): Promise<TransitionResult> {
  const lead = await store.findLead(leadId);
  if (!lead) return { ok: false, error: "Lead não encontrado." };

  const stage = await store.findStageByRole(role);
  // Sai antes de escrever qualquer coisa: sem coluna de destino, o certo
  // é não ter começado.
  if (!stage) return { ok: false, error: role === "won" ? SEM_COLUNA_WON : SEM_COLUNA_LOST };

  return applyTransition(store, lead, stage, agora);
}
