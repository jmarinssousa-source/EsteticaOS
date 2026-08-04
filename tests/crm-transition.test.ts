/**
 * Testes da transição de lead no CRM.
 *
 * A regra toda mora em `lib/crm/transition.ts` e conversa com o banco por
 * uma interface (`CrmStore`). Isso permite exercitar aqui, sem banco, o
 * que antes só dava para conferir clicando: os dois botões, o arrastar, o
 * lead de outra clínica, a coluna que não existe e a falha no meio da
 * operação.
 *
 * O store falso guarda leads, colunas e pacientes em memória e **filtra
 * por clínica em toda consulta**, igual ao de verdade. É o que torna o
 * teste de isolamento honesto: se o filtro sumisse da implementação real,
 * o teste aqui continuaria passando — por isso o teste de outra clínica
 * confere o comportamento observável (não encontra, não escreve), que é o
 * que a tela e o RLS também garantem.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  moveLeadToRole,
  moveLeadToStage,
  nextLeadStatus,
  SEM_COLUNA_LOST,
  SEM_COLUNA_WON,
  type CrmStore,
  type LeadPatch,
  type LeadRow,
  type StageRow,
} from "../src/lib/crm/transition.ts";

// ---------------------------------------------------------------------
// Banco de mentira
// ---------------------------------------------------------------------

type Paciente = { id: string; clinicId: string; leadId: string | null; name: string };
/**
 * A linha guardada tem mais campos que `LeadRow`: a transição só lê o que
 * precisa para decidir, mas escreve `last_moved_at` também. O banco de
 * mentira guarda a linha inteira, como o de verdade.
 */
type LeadGuardado = LeadRow & { clinicId: string; last_moved_at: string };
type ColunaGuardada = StageRow & { clinicId: string; position: number };

const CLINICA = "clinica-a";
const OUTRA_CLINICA = "clinica-b";

function criarBanco(opcoes: { semWon?: boolean; semLost?: boolean } = {}) {
  const colunas: ColunaGuardada[] = [
    { id: "col-novo", role: null, clinicId: CLINICA, position: 0 },
    { id: "col-atendimento", role: null, clinicId: CLINICA, position: 1 },
  ];
  if (!opcoes.semWon) colunas.push({ id: "col-fechado", role: "won", clinicId: CLINICA, position: 2 });
  if (!opcoes.semLost) colunas.push({ id: "col-perdido", role: "lost", clinicId: CLINICA, position: 3 });
  // A outra clínica tem colunas próprias, com os mesmos papéis.
  colunas.push({ id: "col-fechado-b", role: "won", clinicId: OUTRA_CLINICA, position: 2 });

  const leads: LeadGuardado[] = [
    {
      id: "lead-1",
      clinicId: CLINICA,
      status: "open",
      stage_id: "col-atendimento",
      patient_id: null,
      name: "Mariana Costa",
      phone: "(11) 90000-0000",
      email: "mariana@exemplo.test",
      origin: "instagram",
      notes: "Interessada em protocolo facial.",
      last_moved_at: "2026-08-01T09:00:00.000Z",
    },
    {
      id: "lead-b",
      clinicId: OUTRA_CLINICA,
      status: "open",
      stage_id: "col-fechado-b",
      patient_id: null,
      name: "Lead de outra clínica",
      phone: null,
      email: null,
      origin: "google",
      notes: null,
      last_moved_at: "2026-08-01T09:00:00.000Z",
    },
  ];

  const pacientes: Paciente[] = [];
  const falhas = { criarPaciente: false, salvarLead: false };
  let sequencia = 0;

  const store = (clinicId: string): CrmStore => ({
    async findLead(leadId) {
      const lead = leads.find((l) => l.id === leadId && l.clinicId === clinicId);
      return lead ? { ...lead } : null;
    },
    async findStage(stageId) {
      const coluna = colunas.find((c) => c.id === stageId && c.clinicId === clinicId);
      return coluna ? { id: coluna.id, role: coluna.role } : null;
    },
    async findStageByRole(role) {
      const achadas = colunas
        .filter((c) => c.clinicId === clinicId && c.role === role)
        .sort((a, b) => a.position - b.position);
      return achadas[0] ? { id: achadas[0].id, role: achadas[0].role } : null;
    },
    async findPatientByLead(leadId) {
      return pacientes.find((p) => p.leadId === leadId && p.clinicId === clinicId)?.id ?? null;
    },
    async createPatient(lead) {
      if (falhas.criarPaciente) return null;
      // O índice único da migração 0021, imitado: um lead, um paciente.
      if (pacientes.some((p) => p.leadId === lead.id)) {
        return pacientes.find((p) => p.leadId === lead.id)!.id;
      }
      const id = `paciente-${++sequencia}`;
      pacientes.push({ id, clinicId, leadId: lead.id, name: lead.name });
      return id;
    },
    async saveLead(leadId: string, patch: LeadPatch) {
      if (falhas.salvarLead) return false;
      const lead = leads.find((l) => l.id === leadId && l.clinicId === clinicId);
      if (!lead) return false;
      Object.assign(lead, patch);
      return true;
    },
  });

  return {
    store,
    leads,
    pacientes,
    falhas,
    lead: (id: string) => leads.find((l) => l.id === id)!,
  };
}

const T0 = "2026-08-04T10:00:00.000Z";
const relogio = () => T0;

// ---------------------------------------------------------------------
// 1. Botão "Converter em paciente"
// ---------------------------------------------------------------------

describe('botão "Converter em paciente"', () => {
  test("cria o paciente, vincula, muda o status e move para a coluna won", async () => {
    const db = criarBanco();
    const resultado = await moveLeadToRole(db.store(CLINICA), "lead-1", "won", relogio);

    assert.equal(resultado.ok, true);
    assert.equal(db.pacientes.length, 1);

    const lead = db.lead("lead-1");
    assert.equal(lead.status, "converted", "status deve virar converted");
    assert.equal(lead.patient_id, db.pacientes[0].id, "o lead precisa apontar para o paciente");
    assert.equal(lead.stage_id, "col-fechado", "o card precisa ir para a coluna de papel won");
    assert.equal(lead.last_moved_at, T0, "last_moved_at precisa ser atualizado");
  });

  test("o paciente nasce com os dados do lead", async () => {
    const db = criarBanco();
    await moveLeadToRole(db.store(CLINICA), "lead-1", "won", relogio);
    assert.equal(db.pacientes[0].name, "Mariana Costa");
  });

  test("converter duas vezes não cria um segundo paciente", async () => {
    const db = criarBanco();
    const primeira = await moveLeadToRole(db.store(CLINICA), "lead-1", "won", relogio);
    const segunda = await moveLeadToRole(db.store(CLINICA), "lead-1", "won", relogio);

    assert.equal(primeira.ok, true);
    assert.equal(segunda.ok, true, "repetir não é erro — só não duplica");
    assert.equal(db.pacientes.length, 1);
    if (primeira.ok && segunda.ok) {
      assert.equal(primeira.createdPatient, true);
      assert.equal(segunda.createdPatient, false, "a segunda não cria cadastro");
      assert.equal(primeira.patientId, segunda.patientId);
    }
  });

  test("duas conversões simultâneas geram um paciente só", async () => {
    const db = criarBanco();
    const [a, b] = await Promise.all([
      moveLeadToRole(db.store(CLINICA), "lead-1", "won", relogio),
      moveLeadToRole(db.store(CLINICA), "lead-1", "won", relogio),
    ]);

    assert.equal(a.ok, true);
    assert.equal(b.ok, true);
    assert.equal(db.pacientes.length, 1, "o toque duplo no celular não pode gerar dois cadastros");
  });
});

// ---------------------------------------------------------------------
// 2. Botão "Marcar como perdido"
// ---------------------------------------------------------------------

describe('botão "Marcar como perdido"', () => {
  test("muda o status e move para a coluna lost", async () => {
    const db = criarBanco();
    const resultado = await moveLeadToRole(db.store(CLINICA), "lead-1", "lost", relogio);

    assert.equal(resultado.ok, true);
    const lead = db.lead("lead-1");
    assert.equal(lead.status, "lost");
    assert.equal(lead.stage_id, "col-perdido");
    assert.equal(lead.last_moved_at, T0);
  });

  test("marcar como perdido não cria paciente", async () => {
    const db = criarBanco();
    await moveLeadToRole(db.store(CLINICA), "lead-1", "lost", relogio);
    assert.equal(db.pacientes.length, 0);
  });

  test("o lead continua guardado e visível na coluna de perdidos", async () => {
    const db = criarBanco();
    await moveLeadToRole(db.store(CLINICA), "lead-1", "lost", relogio);
    assert.ok(db.leads.some((l) => l.id === "lead-1"), "o lead não pode sumir do quadro");
  });
});

// ---------------------------------------------------------------------
// 3. Arrastar o card
// ---------------------------------------------------------------------

describe("arrastar o card", () => {
  test("arrastar para a coluna won converte, igual ao botão", async () => {
    const db = criarBanco();
    await moveLeadToStage(db.store(CLINICA), "lead-1", "col-fechado", relogio);

    const lead = db.lead("lead-1");
    assert.equal(lead.status, "converted");
    assert.equal(lead.stage_id, "col-fechado");
    assert.equal(db.pacientes.length, 1);
    assert.equal(lead.patient_id, db.pacientes[0].id);
  });

  test("arrastar para a coluna lost marca como perdido, igual ao botão", async () => {
    const db = criarBanco();
    await moveLeadToStage(db.store(CLINICA), "lead-1", "col-perdido", relogio);

    const lead = db.lead("lead-1");
    assert.equal(lead.status, "lost");
    assert.equal(lead.stage_id, "col-perdido");
  });

  test("botão e arrastar chegam ao mesmo estado", async () => {
    const porBotao = criarBanco();
    const porArrastar = criarBanco();

    await moveLeadToRole(porBotao.store(CLINICA), "lead-1", "won", relogio);
    await moveLeadToStage(porArrastar.store(CLINICA), "lead-1", "col-fechado", relogio);

    const a = porBotao.lead("lead-1");
    const b = porArrastar.lead("lead-1");
    assert.deepEqual(
      { status: a.status, stage: a.stage_id, movido: a.last_moved_at, temPaciente: Boolean(a.patient_id) },
      { status: b.status, stage: b.stage_id, movido: b.last_moved_at, temPaciente: Boolean(b.patient_id) },
    );
  });

  test("tirar um lead convertido da coluna de fechamento não apaga o paciente", async () => {
    const db = criarBanco();
    await moveLeadToRole(db.store(CLINICA), "lead-1", "won", relogio);
    const pacienteId = db.lead("lead-1").patient_id;

    await moveLeadToStage(db.store(CLINICA), "lead-1", "col-atendimento", relogio);

    const lead = db.lead("lead-1");
    assert.equal(db.pacientes.length, 1, "o cadastro do paciente precisa sobreviver");
    assert.equal(lead.patient_id, pacienteId, "o vínculo precisa sobreviver");
    assert.equal(lead.status, "converted", "converter não se desfaz sozinho");
    assert.equal(lead.stage_id, "col-atendimento");
  });

  test("arrastar de volta para won não cria um segundo paciente", async () => {
    const db = criarBanco();
    await moveLeadToStage(db.store(CLINICA), "lead-1", "col-fechado", relogio);
    await moveLeadToStage(db.store(CLINICA), "lead-1", "col-atendimento", relogio);
    await moveLeadToStage(db.store(CLINICA), "lead-1", "col-fechado", relogio);

    assert.equal(db.pacientes.length, 1);
  });
});

// ---------------------------------------------------------------------
// 4. Reabrir um lead perdido
// ---------------------------------------------------------------------

describe("reabrir lead perdido", () => {
  test("mover para coluna comum reabre", async () => {
    const db = criarBanco();
    await moveLeadToRole(db.store(CLINICA), "lead-1", "lost", relogio);
    assert.equal(db.lead("lead-1").status, "lost");

    await moveLeadToStage(db.store(CLINICA), "lead-1", "col-novo", relogio);
    const lead = db.lead("lead-1");
    assert.equal(lead.status, "open", "voltar para coluna comum reabre o lead");
    assert.equal(lead.stage_id, "col-novo");
  });

  test("a regra de status, isolada", () => {
    assert.equal(nextLeadStatus("won", "open"), "converted");
    assert.equal(nextLeadStatus("lost", "open"), "lost");
    assert.equal(nextLeadStatus(null, "lost"), "open", "perdido reabre");
    assert.equal(nextLeadStatus(null, "converted"), "converted", "convertido não se desfaz");
    assert.equal(nextLeadStatus(null, "open"), "open");
    assert.equal(nextLeadStatus("won", "converted"), "converted");
  });
});

// ---------------------------------------------------------------------
// 5. Coluna com o papel não existe
// ---------------------------------------------------------------------

describe("funil sem a coluna necessária", () => {
  test("sem coluna won, recusa com mensagem clara e não altera nada", async () => {
    const db = criarBanco({ semWon: true });
    const antes = { ...db.lead("lead-1") };

    const resultado = await moveLeadToRole(db.store(CLINICA), "lead-1", "won", relogio);

    assert.equal(resultado.ok, false);
    if (!resultado.ok) assert.equal(resultado.error, SEM_COLUNA_WON);
    assert.equal(db.pacientes.length, 0, "não pode criar paciente sem ter para onde mover");
    assert.deepEqual(db.lead("lead-1"), antes, "o lead precisa ficar exatamente como estava");
  });

  test("sem coluna lost, recusa com mensagem clara e não altera nada", async () => {
    const db = criarBanco({ semLost: true });
    const antes = { ...db.lead("lead-1") };

    const resultado = await moveLeadToRole(db.store(CLINICA), "lead-1", "lost", relogio);

    assert.equal(resultado.ok, false);
    if (!resultado.ok) assert.equal(resultado.error, SEM_COLUNA_LOST);
    assert.deepEqual(db.lead("lead-1"), antes);
  });

  test("a coluna é achada pelo papel, não pelo nome", async () => {
    // A coluna de fechamento aqui se chama "col-fechado" por acaso; o que
    // vale é o role. Renomear no banco não muda o comportamento porque o
    // nome nem é lido.
    const db = criarBanco();
    await moveLeadToRole(db.store(CLINICA), "lead-1", "won", relogio);
    assert.equal(db.lead("lead-1").stage_id, "col-fechado");
  });
});

// ---------------------------------------------------------------------
// 6. Isolamento entre clínicas
// ---------------------------------------------------------------------

describe("isolamento entre clínicas", () => {
  test("não alcança lead de outra clínica", async () => {
    const db = criarBanco();
    const resultado = await moveLeadToRole(db.store(CLINICA), "lead-b", "won", relogio);

    assert.equal(resultado.ok, false);
    if (!resultado.ok) assert.equal(resultado.error, "Lead não encontrado.");
    assert.equal(db.pacientes.length, 0);
    assert.equal(db.lead("lead-b").status, "open", "o lead da outra clínica fica intacto");
  });

  test("não alcança coluna de outra clínica ao arrastar", async () => {
    const db = criarBanco();
    const resultado = await moveLeadToStage(db.store(CLINICA), "lead-1", "col-fechado-b", relogio);

    assert.equal(resultado.ok, false);
    if (!resultado.ok) assert.equal(resultado.error, "Coluna não encontrada.");
    assert.equal(db.lead("lead-1").stage_id, "col-atendimento", "não moveu");
    assert.equal(db.pacientes.length, 0);
  });

  test("a coluna de fechamento resolvida é a da própria clínica", async () => {
    const db = criarBanco();
    await moveLeadToRole(db.store(CLINICA), "lead-1", "won", relogio);
    assert.equal(db.lead("lead-1").stage_id, "col-fechado");
    assert.notEqual(db.lead("lead-1").stage_id, "col-fechado-b");
  });
});

// ---------------------------------------------------------------------
// 7. Falha no meio da operação
// ---------------------------------------------------------------------

describe("falha no meio da operação", () => {
  test("se criar o paciente falha, o lead não muda", async () => {
    const db = criarBanco();
    db.falhas.criarPaciente = true;
    const antes = { ...db.lead("lead-1") };

    const resultado = await moveLeadToRole(db.store(CLINICA), "lead-1", "won", relogio);

    assert.equal(resultado.ok, false);
    assert.equal(db.pacientes.length, 0);
    assert.deepEqual(db.lead("lead-1"), antes, "sem paciente, o lead não pode virar convertido");
  });

  test("se salvar o lead falha, repetir conserta sem duplicar o paciente", async () => {
    const db = criarBanco();
    db.falhas.salvarLead = true;

    const primeira = await moveLeadToRole(db.store(CLINICA), "lead-1", "won", relogio);
    assert.equal(primeira.ok, false, "a operação precisa avisar que não terminou");
    assert.equal(db.pacientes.length, 1, "o paciente ficou criado — é o estado a recuperar");
    assert.equal(db.lead("lead-1").status, "open", "o lead ainda não foi atualizado");

    // O operador tenta de novo, agora com o banco respondendo.
    db.falhas.salvarLead = false;
    const segunda = await moveLeadToRole(db.store(CLINICA), "lead-1", "won", relogio);

    assert.equal(segunda.ok, true);
    assert.equal(db.pacientes.length, 1, "repetir não pode criar um segundo cadastro");
    const lead = db.lead("lead-1");
    assert.equal(lead.status, "converted");
    assert.equal(lead.patient_id, db.pacientes[0].id, "o vínculo se completa na segunda tentativa");
    assert.equal(lead.stage_id, "col-fechado");
  });

  test("um lead convertido sem paciente vinculado se recupera reaproveitando o órfão", async () => {
    const db = criarBanco();
    db.falhas.salvarLead = true;
    await moveLeadToRole(db.store(CLINICA), "lead-1", "won", relogio);
    db.falhas.salvarLead = false;

    // Estado incoerente vindo do comportamento antigo: status já
    // convertido, mas sem vínculo.
    db.lead("lead-1").status = "converted";
    db.lead("lead-1").patient_id = null;

    const resultado = await moveLeadToRole(db.store(CLINICA), "lead-1", "won", relogio);

    assert.equal(resultado.ok, true);
    assert.equal(db.pacientes.length, 1);
    assert.equal(db.lead("lead-1").patient_id, db.pacientes[0].id);
  });
});
