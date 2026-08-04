"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember, requirePermission } from "@/lib/auth/session";
import { leadSchema, stageNameSchema, interactionSchema } from "@/lib/validations/crm";
import { DEFAULT_STAGES, type StageRole } from "@/lib/crm/constants";
import {
  moveLeadToRole as aplicarPorPapel,
  moveLeadToStage as aplicarPorColuna,
  type CrmStore,
  type LeadRow,
  type TransitionResult,
} from "@/lib/crm/transition";
import type { ActionState } from "@/actions/auth";

type ActionResult = { error?: string } | { success: true };

/**
 * Traduz o lead validado para os nomes de coluna do banco. Sem isso o
 * insert/update ia com `nextAction`, `followUpDate` e `potentialValue`,
 * que não existem em `leads` — o Postgres recusava e a tela só dizia
 * "Não foi possível criar o lead".
 */
function toLeadRow(data: {
  name: string;
  phone: string | null;
  email: string | null;
  origin: string;
  assignedTo: string | null;
  nextAction: string | null;
  followUpDate: string | null;
  potentialValue: number | null;
  notes: string | null;
}) {
  return {
    name: data.name,
    phone: data.phone,
    email: data.email,
    origin: data.origin,
    assigned_to: data.assignedTo,
    next_action: data.nextAction,
    follow_up_date: data.followUpDate,
    potential_value: data.potentialValue,
    notes: data.notes,
  };
}

function revalidateCrm() {
  revalidatePath("/crm");
}

/** Called from the CRM page on load; idempotent. */
export async function ensureDefaultStages(clinicId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("crm_stages")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", clinicId);

  if (count && count > 0) return;

  await supabase.from("crm_stages").insert(
    DEFAULT_STAGES.map((stage, index) => ({
      clinic_id: clinicId,
      name: stage.name,
      role: stage.role,
      position: index,
    })),
  );
}

export async function createStage(name: string): Promise<ActionResult> {
  const member = await requirePermission("crm_edit");
  const parsed = stageNameSchema.safeParse({ name });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Nome inválido." };

  const supabase = await createClient();
  const { count } = await supabase
    .from("crm_stages")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", member.clinicId);

  const { error } = await supabase.from("crm_stages").insert({
    clinic_id: member.clinicId,
    name: parsed.data.name,
    position: count ?? 0,
  });

  if (error) return { error: "Não foi possível criar a coluna." };
  revalidateCrm();
  return { success: true };
}

export async function renameStage(stageId: string, name: string): Promise<ActionResult> {
  const member = await requirePermission("crm_edit");
  const parsed = stageNameSchema.safeParse({ name });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Nome inválido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("crm_stages")
    .update({ name: parsed.data.name })
    .eq("id", stageId)
    .eq("clinic_id", member.clinicId);

  if (error) return { error: "Não foi possível renomear a coluna." };
  revalidateCrm();
  return { success: true };
}

export async function deleteStage(stageId: string): Promise<ActionResult> {
  const member = await requirePermission("crm_edit");
  const supabase = await createClient();

  const { count } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("stage_id", stageId)
    .eq("clinic_id", member.clinicId);

  if (count && count > 0) {
    return { error: "Mova ou remova os leads desta coluna antes de excluí-la." };
  }

  const { error } = await supabase
    .from("crm_stages")
    .delete()
    .eq("id", stageId)
    .eq("clinic_id", member.clinicId);

  if (error) return { error: "Não foi possível excluir a coluna." };
  revalidateCrm();
  return { success: true };
}

export async function reorderStages(orderedStageIds: string[]): Promise<ActionResult> {
  const member = await requirePermission("crm_edit");
  const supabase = await createClient();

  const { error } = await Promise.all(
    orderedStageIds.map((id, index) =>
      supabase
        .from("crm_stages")
        .update({ position: index })
        .eq("id", id)
        .eq("clinic_id", member.clinicId),
    ),
  ).then((results) => {
    const failed = results.find((r) => r.error);
    return { error: failed?.error ?? null };
  });

  if (error) return { error: "Não foi possível reordenar as colunas." };

  revalidateCrm();
  return { success: true };
}

export async function deleteLead(leadId: string): Promise<ActionResult> {
  const member = await requirePermission("crm_edit");
  const supabase = await createClient();

  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", leadId)
    .eq("clinic_id", member.clinicId);

  if (error) return { error: "Não foi possível excluir o lead." };
  revalidateCrm();
  return { success: true };
}

export async function createLead(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const member = await requirePermission("crm_edit");

  const parsed = leadSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    origin: formData.get("origin"),
    assignedTo: formData.get("assignedTo"),
    nextAction: formData.get("nextAction"),
    followUpDate: formData.get("followUpDate"),
    potentialValue: formData.get("potentialValue"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: firstStage } = await supabase
    .from("crm_stages")
    .select("id")
    .eq("clinic_id", member.clinicId)
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!firstStage) return { error: "Nenhuma coluna encontrada. Recarregue a página." };

  const { error } = await supabase.from("leads").insert({
    clinic_id: member.clinicId,
    stage_id: firstStage.id,
    ...toLeadRow(parsed.data),
  });

  if (error) {
    console.error("createLead falhou:", error.message);
    return { error: "Não foi possível criar o lead." };
  }

  revalidateCrm();
  return { success: true };
}

export async function updateLead(
  leadId: string,
  patch: {
    name: string;
    phone: string;
    email: string;
    origin: string;
    assignedTo: string;
    nextAction: string;
    followUpDate: string;
    potentialValue: string;
    notes: string;
  },
): Promise<ActionResult> {
  const member = await requirePermission("crm_edit");
  const parsed = leadSchema.safeParse(patch);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update(toLeadRow(parsed.data))
    .eq("id", leadId)
    .eq("clinic_id", member.clinicId);

  if (error) {
    console.error("updateLead falhou:", error.message);
    return { error: "Não foi possível salvar o lead." };
  }
  revalidateCrm();
  return { success: true };
}

/**
 * Acesso ao banco para a transição de lead, preso a uma clínica.
 *
 * Cada consulta filtra por `clinic_id` além do RLS. É cinto e
 * suspensório de propósito: o RLS filtra em silêncio (devolve zero
 * linhas em vez de recusar), então um erro aqui viraria "não encontrado"
 * em vez de vazamento — mas o filtro explícito torna a intenção legível
 * para quem for mexer depois.
 */
function crmStore(clinicId: string, supabase: Awaited<ReturnType<typeof createClient>>): CrmStore {
  return {
    async findLead(leadId) {
      const { data } = await supabase
        .from("leads")
        .select("id, status, stage_id, patient_id, name, phone, email, origin, notes")
        .eq("id", leadId)
        .eq("clinic_id", clinicId)
        .maybeSingle();
      return (data as LeadRow | null) ?? null;
    },

    async findStage(stageId) {
      const { data } = await supabase
        .from("crm_stages")
        .select("id, role")
        .eq("id", stageId)
        .eq("clinic_id", clinicId)
        .maybeSingle();
      return data ? { id: data.id, role: data.role as StageRole | null } : null;
    },

    async findStageByRole(role) {
      // `position` para desempatar: se a clínica acabar com duas colunas
      // do mesmo papel, a escolhida é sempre a mesma — a primeira do
      // funil —, e não a que o banco devolver primeiro naquele dia.
      const { data } = await supabase
        .from("crm_stages")
        .select("id, role")
        .eq("clinic_id", clinicId)
        .eq("role", role)
        .order("position", { ascending: true })
        .limit(1)
        .maybeSingle();
      return data ? { id: data.id, role: data.role as StageRole | null } : null;
    },

    async findPatientByLead(leadId) {
      const { data } = await supabase
        .from("patients")
        .select("id")
        .eq("lead_id", leadId)
        .eq("clinic_id", clinicId)
        .maybeSingle();
      return data?.id ?? null;
    },

    async createPatient(lead) {
      const { data, error } = await supabase
        .from("patients")
        .insert({
          clinic_id: clinicId,
          lead_id: lead.id,
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          origin: lead.origin,
          notes: lead.notes,
        })
        .select("id")
        .single();

      // 23505 é a violação do índice único de `patients(lead_id)`
      // (migração 0021): outra requisição criou o paciente entre a nossa
      // busca e a nossa inserção. Não é erro — é a corrida sendo perdida.
      // Quem ganhou já criou o cadastro certo; basta usá-lo.
      if (error?.code === "23505") {
        const { data: existente } = await supabase
          .from("patients")
          .select("id")
          .eq("lead_id", lead.id)
          .eq("clinic_id", clinicId)
          .maybeSingle();
        return existente?.id ?? null;
      }

      if (error) {
        console.error("createPatient (conversão de lead) falhou:", error.message);
        return null;
      }
      return data?.id ?? null;
    },

    async saveLead(leadId, patch) {
      const { error } = await supabase
        .from("leads")
        .update(patch)
        .eq("id", leadId)
        .eq("clinic_id", clinicId);

      if (error) console.error("saveLead falhou:", error.message);
      return !error;
    },
  };
}

/** Traduz o resultado da transição para o formato que as telas esperam. */
function toActionResult(resultado: TransitionResult): ActionResult {
  if (!resultado.ok) return { error: resultado.error };
  revalidateCrm();
  return { success: true };
}

/**
 * Move o card e aplica o papel da coluna de destino, para o quadro e os
 * números do sistema contarem a mesma história:
 *   - coluna "perdido" → marca o lead como perdido
 *   - coluna "ganho"   → converte em paciente (a tela confirma antes)
 *   - coluna comum     → reabre um lead que estava perdido
 * Conversão não se desfaz sozinha: o paciente já existe, então tirar o
 * card da coluna de ganho não apaga o cadastro.
 *
 * A regra em si mora em `lib/crm/transition.ts`, compartilhada com os
 * botões do card.
 */
export async function moveLeadToStage(leadId: string, stageId: string): Promise<ActionResult> {
  const member = await requirePermission("crm_edit");
  const supabase = await createClient();

  return toActionResult(await aplicarPorColuna(crmStore(member.clinicId, supabase), leadId, stageId));
}

export async function addLeadInteraction(leadId: string, note: string): Promise<ActionResult> {
  const member = await requirePermission("crm_edit");
  const parsed = interactionSchema.safeParse({ note });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Anotação inválida." };

  const supabase = await createClient();
  const { error } = await supabase.from("lead_interactions").insert({
    clinic_id: member.clinicId,
    lead_id: leadId,
    author_id: member.userId,
    note: parsed.data.note,
  });

  if (error) return { error: "Não foi possível salvar a anotação." };

  // Anotar uma conversa também é dar atenção ao lead: zera o contador de
  // "parado", que antes só reiniciava ao arrastar o card de coluna.
  await supabase
    .from("leads")
    .update({ last_moved_at: new Date().toISOString() })
    .eq("id", leadId)
    .eq("clinic_id", member.clinicId);

  revalidateCrm();
  return { success: true };
}

export type LeadInteraction = {
  id: string;
  note: string;
  author_id: string | null;
  created_at: string;
};

export async function getLeadInteractions(leadId: string): Promise<LeadInteraction[]> {
  const member = await getCurrentMember();
  if (!member) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("lead_interactions")
    .select("id, note, author_id, created_at")
    .eq("lead_id", leadId)
    .eq("clinic_id", member.clinicId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

/**
 * Botão "Marcar como perdido".
 *
 * Antes só escrevia `status = 'lost'`: o card ficava com a etiqueta de
 * perdido parado na coluna onde estava, e o contador de "lead parado"
 * não zerava. Agora faz o mesmo que arrastar para a coluna de papel
 * `lost` — porque é literalmente o mesmo caminho.
 */
export async function markLeadLost(leadId: string): Promise<ActionResult> {
  const member = await requirePermission("crm_edit");
  const supabase = await createClient();

  return toActionResult(await aplicarPorPapel(crmStore(member.clinicId, supabase), leadId, "lost"));
}

/**
 * Botão "Converter em paciente".
 *
 * Duas coisas mudaram aqui, além de o lead passar a ir para a coluna de
 * fechamento:
 *
 * 1. A permissão. Isto exigia só sessão (`getCurrentMember`), enquanto
 *    todo o resto do CRM exige `crm_edit` — ou seja, quem só tinha
 *    permissão de *ver* o CRM conseguia criar paciente. O perfil
 *    Recepção tem as duas, então na prática ninguém tropeçava nisso; um
 *    perfil com `crm_view` e sem `crm_edit`, sim.
 * 2. Converter de novo deixou de ser erro. Antes respondia "este lead já
 *    foi convertido"; agora a segunda chamada só garante que o card está
 *    na coluna certa, sem criar um segundo cadastro. É o que faz repetir
 *    a operação consertar uma tentativa que falhou no meio, em vez de
 *    travar.
 */
export async function convertLeadToPatient(leadId: string): Promise<ActionResult> {
  const member = await requirePermission("crm_edit");
  const supabase = await createClient();

  return toActionResult(await aplicarPorPapel(crmStore(member.clinicId, supabase), leadId, "won"));
}
