// Seed de dados de demonstração para a clínica do usuário indicado por
// TARGET_EMAIL. Usa o service role (bypassa RLS), igual ao bootstrap de
// signup/convites em src/actions/auth.ts e src/actions/users.ts.
//
// Uso: node scripts/seed-demo.mjs

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const TARGET_EMAIL = "jonatamarinssousa@gmail.com";
const DEMO_PASSWORD = "Demo@12345";

function loadEnvLocal() {
  const path = new URL("../.env.local", import.meta.url);
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY em .env.local");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function todayPlusDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function currentYearMonth() {
  return new Date().toISOString().slice(0, 7);
}

async function findUserByEmail(email) {
  let page = 1;
  const perPage = 200;
  for (let i = 0; i < 5; i++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < perPage) break;
    page++;
  }
  return null;
}

async function ensureDemoUser(fullName, email, role, clinicId) {
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listErr) throw listErr;
  let user = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error) throw new Error(`createUser(${email}): ${error.message}`);
    user = data.user;
  }

  const { data: existingMember } = await admin
    .from("clinic_members")
    .select("id")
    .eq("clinic_id", clinicId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existingMember) {
    const { error } = await admin.from("clinic_members").insert({
      clinic_id: clinicId,
      user_id: user.id,
      full_name: fullName,
      email,
      role,
      permissions: {},
      status: "active",
    });
    if (error) throw new Error(`clinic_members insert (${email}): ${error.message}`);
  }

  return user.id;
}

async function main() {
  console.log(`Buscando usuário ${TARGET_EMAIL}...`);
  const authUser = await findUserByEmail(TARGET_EMAIL);
  if (!authUser) {
    console.error(`Nenhum usuário com e-mail ${TARGET_EMAIL} encontrado no Supabase Auth.`);
    console.error("Crie a conta primeiro (cadastro no app) e rode este script de novo.");
    process.exit(1);
  }

  const { data: ownerMember, error: ownerErr } = await admin
    .from("clinic_members")
    .select("id, clinic_id, full_name, role")
    .eq("user_id", authUser.id)
    .maybeSingle();

  if (ownerErr) throw ownerErr;
  if (!ownerMember) {
    console.error(`Usuário ${TARGET_EMAIL} não tem clínica associada (clinic_members vazio).`);
    process.exit(1);
  }

  const clinicId = ownerMember.clinic_id;
  console.log(`Clínica encontrada: ${clinicId} (owner: ${ownerMember.full_name})`);

  // ---------------------------------------------------------------------
  // 1. Equipe (profissionais + recepção + financeiro)
  // ---------------------------------------------------------------------
  console.log("Criando equipe (profissionais, recepção, financeiro)...");
  const team = {
    amanda: await ensureDemoUser("Dra. Amanda Ferreira", "amanda.ferreira.demo@esteticaos.app", "professional", clinicId),
    beatriz: await ensureDemoUser("Beatriz Lima", "beatriz.lima.demo@esteticaos.app", "professional", clinicId),
    camila: await ensureDemoUser("Camila Rocha", "camila.rocha.demo@esteticaos.app", "professional", clinicId),
    rafael: await ensureDemoUser("Dr. Rafael Nogueira", "rafael.nogueira.demo@esteticaos.app", "professional", clinicId),
    juliana: await ensureDemoUser("Juliana Alves", "juliana.alves.demo@esteticaos.app", "reception", clinicId),
    patricia: await ensureDemoUser("Patrícia Souza", "patricia.souza.demo@esteticaos.app", "finance", clinicId),
  };
  const professionalIds = [team.amanda, team.beatriz, team.camila, team.rafael];

  // ---------------------------------------------------------------------
  // 2. CRM — colunas padrão
  // ---------------------------------------------------------------------
  console.log("Garantindo colunas do CRM...");
  const { count: stageCount } = await admin
    .from("crm_stages")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", clinicId);

  const DEFAULT_STAGES = [
    "Novo lead",
    "Em atendimento",
    "Avaliação marcada",
    "Compareceu",
    "Orçamento enviado",
    "Fechado",
    "Perdido",
  ];

  if (!stageCount) {
    await admin.from("crm_stages").insert(
      DEFAULT_STAGES.map((name, index) => ({ clinic_id: clinicId, name, position: index })),
    );
  }

  const { data: stages } = await admin
    .from("crm_stages")
    .select("id, name, position")
    .eq("clinic_id", clinicId)
    .order("position", { ascending: true });

  const stageByName = Object.fromEntries(stages.map((s) => [s.name, s.id]));

  // ---------------------------------------------------------------------
  // 3. Procedimentos (valores/serviços)
  // ---------------------------------------------------------------------
  console.log("Criando procedimentos...");
  const procedureDefs = [
    { name: "Limpeza de Pele Profunda", price: 120, duration_minutes: 60 },
    { name: "Botox (por região)", price: 800, duration_minutes: 30 },
    { name: "Preenchimento Labial", price: 1200, duration_minutes: 45 },
    { name: "Drenagem Linfática", price: 150, duration_minutes: 60 },
    { name: "Peeling Químico", price: 250, duration_minutes: 40 },
    { name: "Microagulhamento", price: 300, duration_minutes: 50 },
    { name: "Massagem Modeladora", price: 130, duration_minutes: 60 },
    { name: "Depilação a Laser (sessão)", price: 180, duration_minutes: 30 },
    { name: "Criolipólise", price: 450, duration_minutes: 60 },
    { name: "Radiofrequência Facial", price: 220, duration_minutes: 45 },
  ];

  const { data: existingProcedures } = await admin
    .from("procedures")
    .select("id, name")
    .eq("clinic_id", clinicId);

  const procByName = Object.fromEntries((existingProcedures ?? []).map((p) => [p.name, p.id]));
  const toInsertProcedures = procedureDefs.filter((p) => !procByName[p.name]);
  if (toInsertProcedures.length) {
    const { data: inserted, error } = await admin
      .from("procedures")
      .insert(toInsertProcedures.map((p) => ({ clinic_id: clinicId, ...p })))
      .select("id, name");
    if (error) throw error;
    for (const p of inserted) procByName[p.name] = p.id;
  }

  // ---------------------------------------------------------------------
  // 4. Pacotes
  // ---------------------------------------------------------------------
  console.log("Criando pacotes...");
  const { count: packageCount } = await admin
    .from("packages")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", clinicId);

  let packages = [];
  if (!packageCount) {
    const { data: pkgInserted, error: pkgErr } = await admin
      .from("packages")
      .insert([
        {
          clinic_id: clinicId,
          name: "Pacote Drenagem Linfática — 10 sessões",
          total_sessions: 10,
          price: 1200,
          validity_days: 180,
          notes: "Pacote fechado, sessões semanais.",
        },
        {
          clinic_id: clinicId,
          name: "Pacote Depilação a Laser — 6 sessões",
          total_sessions: 6,
          price: 900,
          validity_days: 365,
          notes: "Válido para uma região à escolha da paciente.",
        },
      ])
      .select("id, name");
    if (pkgErr) throw pkgErr;
    packages = pkgInserted;

    await admin.from("package_procedures").insert([
      {
        package_id: packages[0].id,
        clinic_id: clinicId,
        procedure_id: procByName["Drenagem Linfática"],
      },
      {
        package_id: packages[1].id,
        clinic_id: clinicId,
        procedure_id: procByName["Depilação a Laser (sessão)"],
      },
    ]);
  } else {
    const { data } = await admin.from("packages").select("id, name").eq("clinic_id", clinicId);
    packages = data;
  }

  const packageDrenagem = packages.find((p) => p.name.includes("Drenagem"));
  const packageLaser = packages.find((p) => p.name.includes("Laser"));

  // ---------------------------------------------------------------------
  // 5. Pacientes
  // ---------------------------------------------------------------------
  console.log("Criando pacientes...");
  const patientDefs = [
    { name: "Mariana Costa Silva", phone: "(11) 98211-3344", email: "mariana.costa@example.com", cpf: "123.456.789-01", birth_date: "1990-03-14", gender: "feminino", address: "Rua das Acácias, 120 — São Paulo, SP", origin: "instagram", notes: "Interessada em protocolo facial." },
    { name: "Fernanda Oliveira Santos", phone: "(11) 98322-4455", email: "fernanda.santos@example.com", cpf: "234.567.890-12", birth_date: "1985-07-22", gender: "feminino", address: "Av. Paulista, 900, apto 45 — São Paulo, SP", origin: "indicacao", notes: "Indicada pela paciente Mariana." },
    { name: "Juliana Pereira Almeida", phone: "(11) 98433-5566", email: "juliana.almeida@example.com", cpf: "345.678.901-23", birth_date: "1993-11-02", gender: "feminino", address: "Rua Augusta, 55 — São Paulo, SP", origin: "whatsapp", notes: null },
    { name: "Carla Regina Souza", phone: "(11) 98544-6677", email: "carla.souza@example.com", cpf: "456.789.012-34", birth_date: "1978-01-30", gender: "feminino", address: "Rua Oscar Freire, 300 — São Paulo, SP", origin: "google", notes: "Alergia a ácido glicólico." },
    { name: "Patrícia Gomes Ribeiro", phone: "(11) 98655-7788", email: "patricia.ribeiro@example.com", cpf: "567.890.123-45", birth_date: "1988-09-18", gender: "feminino", address: "Alameda Santos, 210 — São Paulo, SP", origin: "trafego_pago", notes: null },
    { name: "Bianca Martins Rocha", phone: "(11) 98766-8899", email: "bianca.rocha@example.com", cpf: "678.901.234-56", birth_date: "1995-05-09", gender: "feminino", address: "Rua Haddock Lobo, 88 — São Paulo, SP", origin: "presencial", notes: "Cliente antiga, retornou após 1 ano." },
    { name: "Larissa Fernandes Lima", phone: "(11) 98877-9900", email: "larissa.lima@example.com", cpf: "789.012.345-67", birth_date: "1999-12-25", gender: "feminino", address: "Rua Bela Cintra, 400 — São Paulo, SP", origin: "instagram", notes: null },
    { name: "Renata Cardoso Barbosa", phone: "(11) 98988-0011", email: "renata.barbosa@example.com", cpf: "890.123.456-78", birth_date: "1982-04-11", gender: "feminino", address: "Rua Consolação, 1500 — São Paulo, SP", origin: "indicacao", notes: null },
    { name: "Camila Duarte Nascimento", phone: "(11) 99099-1122", email: "camila.nascimento@example.com", cpf: "901.234.567-89", birth_date: "1991-08-06", gender: "feminino", address: "Rua Estados Unidos, 77 — São Paulo, SP", origin: "whatsapp", notes: "Prefere atendimento no período da tarde." },
    { name: "Vanessa Ramos Teixeira", phone: "(11) 99100-2233", email: "vanessa.teixeira@example.com", cpf: "012.345.678-90", birth_date: "1987-02-17", gender: "feminino", address: "Rua Pamplona, 33 — São Paulo, SP", origin: "google", notes: null },
    { name: "André Luiz Monteiro", phone: "(11) 99211-3344", email: "andre.monteiro@example.com", cpf: "112.233.445-56", birth_date: "1984-06-29", gender: "masculino", address: "Rua Frei Caneca, 60 — São Paulo, SP", origin: "instagram", notes: "Primeiro procedimento estético." },
    { name: "Rodrigo Alves Pinto", phone: "(11) 99322-4455", email: "rodrigo.pinto@example.com", cpf: "223.344.556-67", birth_date: "1979-10-03", gender: "masculino", address: "Rua da Consolação, 2000 — São Paulo, SP", origin: "presencial", notes: null },
    { name: "Gabriela Nunes Correia", phone: "(11) 99433-5566", email: "gabriela.correia@example.com", cpf: "334.455.667-78", birth_date: "1996-01-19", gender: "feminino", address: "Rua Cardeal Arcoverde, 12 — São Paulo, SP", origin: "trafego_pago", notes: null },
    { name: "Isabela Castro Moreira", phone: "(11) 99544-6677", email: "isabela.moreira@example.com", cpf: "445.566.778-89", birth_date: "1992-03-27", gender: "feminino", address: "Rua Girassol, 480 — São Paulo, SP", origin: "indicacao", notes: "Quer fazer pacote de sessões." },
    { name: "Tatiane Borges Farias", phone: "(11) 99655-7788", email: "tatiane.farias@example.com", cpf: "556.677.889-90", birth_date: "1990-12-08", gender: "feminino", address: "Rua Harmonia, 150 — São Paulo, SP", origin: "whatsapp", notes: null },
    { name: "Priscila Andrade Vieira", phone: "(11) 99766-8899", email: "priscila.vieira@example.com", cpf: "667.788.990-01", birth_date: "1986-07-15", gender: "feminino", address: "Rua Fradique Coutinho, 220 — São Paulo, SP", origin: "google", notes: null },
    { name: "Débora Machado Cunha", phone: "(11) 99877-9900", email: "debora.cunha@example.com", cpf: "778.899.001-12", birth_date: "1994-09-21", gender: "feminino", address: "Rua Wisard, 300 — São Paulo, SP", origin: "instagram", notes: "Sensível a procedimentos com agulha." },
    { name: "Eduardo Santos Barros", phone: "(11) 99988-0011", email: "eduardo.barros@example.com", cpf: "889.900.112-23", birth_date: "1981-05-05", gender: "masculino", address: "Rua Teodoro Sampaio, 900 — São Paulo, SP", origin: "presencial", notes: null },
  ];

  const { data: existingPatients } = await admin
    .from("patients")
    .select("id, name")
    .eq("clinic_id", clinicId);

  let patients = existingPatients ?? [];
  const existingPatientNames = new Set(patients.map((p) => p.name));
  const missingPatientDefs = patientDefs.filter((p) => !existingPatientNames.has(p.name));
  if (missingPatientDefs.length > 0) {
    const { data: inserted, error } = await admin
      .from("patients")
      .insert(missingPatientDefs.map((p) => ({ clinic_id: clinicId, ...p })))
      .select("id, name");
    if (error) throw error;
    patients = [...patients, ...inserted];
  }
  const demoPatients = patients.filter((p) => patientDefs.some((d) => d.name === p.name));

  // ---------------------------------------------------------------------
  // 6. Leads (CRM)
  // ---------------------------------------------------------------------
  console.log("Criando leads...");
  const { count: leadCount } = await admin
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", clinicId);

  if (!leadCount) {
    const leadDefs = [
      { name: "Sabrina Lopes Teixeira", phone: "(11) 98123-0001", email: "sabrina.lopes@example.com", origin: "instagram", stage: "Novo lead", assigned_to: team.juliana, next_action: "Ligar para agendar avaliação", follow_up_date: todayPlusDays(1), potential_value: 800, notes: "Perguntou sobre Botox." },
      { name: "Natália Ferreira Reis", phone: "(11) 98123-0002", email: "natalia.reis@example.com", origin: "whatsapp", stage: "Novo lead", assigned_to: team.juliana, next_action: "Enviar tabela de preços", follow_up_date: todayPlusDays(2), potential_value: 300, notes: null },
      { name: "Cristina Aparecida Melo", phone: "(11) 98123-0003", email: "cristina.melo@example.com", origin: "indicacao", stage: "Em atendimento", assigned_to: team.juliana, next_action: "Confirmar horário da avaliação", follow_up_date: todayPlusDays(0), potential_value: 1200, notes: "Indicada por paciente Renata." },
      { name: "Aline Souza Vidal", phone: "(11) 98123-0004", email: "aline.vidal@example.com", origin: "google", stage: "Avaliação marcada", assigned_to: team.amanda, next_action: "Avaliação presencial dia 15", follow_up_date: todayPlusDays(5), potential_value: 950, notes: null },
      { name: "Simone Cardoso Dias", phone: "(11) 98123-0005", email: "simone.dias@example.com", origin: "trafego_pago", stage: "Avaliação marcada", assigned_to: team.rafael, next_action: "Confirmar presença por WhatsApp", follow_up_date: todayPlusDays(3), potential_value: 1500, notes: null },
      { name: "Michele Nogueira Prado", phone: "(11) 98123-0006", email: "michele.prado@example.com", origin: "presencial", stage: "Orçamento enviado", assigned_to: team.juliana, next_action: "Follow-up do orçamento", follow_up_date: todayPlusDays(2), potential_value: 2200, notes: "Aguardando aprovação do orçamento de pacote." },
      { name: "Kelly Cristina Rocha", phone: "(11) 98123-0007", email: "kelly.rocha@example.com", origin: "instagram", stage: "Fechado", assigned_to: team.beatriz, next_action: "Nenhuma — já fechou.", follow_up_date: null, potential_value: 600, notes: "Fechou pacote de drenagem." },
      { name: "Doralice Nunes Barros", phone: "(11) 98123-0008", email: "doralice.barros@example.com", origin: "outro", stage: "Perdido", assigned_to: team.juliana, next_action: null, follow_up_date: null, potential_value: 400, notes: "Achou o valor alto e desistiu." },
    ];

    for (const lead of leadDefs) {
      const stageId = stageByName[lead.stage];
      const { stage, ...rest } = lead;
      const status = stage === "Perdido" ? "lost" : stage === "Fechado" ? "converted" : "open";
      await admin.from("leads").insert({
        clinic_id: clinicId,
        stage_id: stageId,
        status,
        ...rest,
      });
    }
  }

  // ---------------------------------------------------------------------
  // 7. Agenda — agendamentos
  // ---------------------------------------------------------------------
  console.log("Criando agendamentos...");
  const { count: apptCount } = await admin
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", clinicId);

  if (!apptCount) {
    const procedureIds = Object.values(procByName);
    const statusCycle = ["scheduled", "confirmed", "attended", "done", "no_show", "canceled_by_patient", "rescheduled"];
    const timeSlots = [
      ["09:00", "10:00"],
      ["10:15", "11:15"],
      ["11:30", "12:15"],
      ["14:00", "14:45"],
      ["15:00", "16:00"],
      ["16:15", "17:00"],
    ];

    const appointments = [];
    let dayOffset = -10;
    for (let i = 0; i < 28; i++) {
      const patient = demoPatients[i % demoPatients.length];
      const professionalId = professionalIds[i % professionalIds.length];
      const procedureId = procedureIds[i % procedureIds.length];
      const [start, end] = timeSlots[i % timeSlots.length];
      const status = dayOffset < 0 ? statusCycle[i % statusCycle.length] : i % 5 === 0 ? "confirmed" : "scheduled";

      appointments.push({
        clinic_id: clinicId,
        patient_id: patient.id,
        professional_id: professionalId,
        procedure_id: procedureId,
        appointment_date: todayPlusDays(dayOffset),
        start_time: start,
        end_time: end,
        status,
        notes: i % 6 === 0 ? "Paciente prefere lembrete por WhatsApp." : null,
      });

      dayOffset += i % 3 === 0 ? 1 : 0;
      if (i === 13) dayOffset = 0;
      dayOffset += 1;
    }

    const { error } = await admin.from("appointments").insert(appointments);
    if (error) throw error;
  }

  // ---------------------------------------------------------------------
  // 8. Orçamentos + itens (+ vendas/financeiro para os aprovados)
  // ---------------------------------------------------------------------
  console.log("Criando orçamentos...");
  const { count: budgetCount } = await admin
    .from("budgets")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", clinicId);

  if (!budgetCount) {
    const budgetPlans = [
      { patient: demoPatients[0], status: "open", items: [{ proc: "Limpeza de Pele Profunda", qty: 1, professional: team.amanda }] },
      { patient: demoPatients[1], status: "sent", items: [{ proc: "Botox (por região)", qty: 2, professional: team.amanda }] },
      { patient: demoPatients[2], status: "approved", items: [{ proc: "Preenchimento Labial", qty: 1, professional: team.rafael }] },
      { patient: demoPatients[3], status: "paid", convertToSale: true, items: [{ proc: "Peeling Químico", qty: 3, professional: team.beatriz }] },
      { patient: demoPatients[4], status: "paid", convertToSale: true, package: packageDrenagem, professional: team.camila },
      { patient: demoPatients[5], status: "rejected", items: [{ proc: "Criolipólise", qty: 1, professional: team.camila }] },
    ];

    for (const plan of budgetPlans) {
      const { data: budget, error: budgetErr } = await admin
        .from("budgets")
        .insert({
          clinic_id: clinicId,
          patient_id: plan.patient.id,
          status: plan.status,
          discount: 0,
          notes: null,
        })
        .select("id")
        .single();
      if (budgetErr) throw budgetErr;

      let itemsTotal = 0;
      if (plan.package) {
        const unitPrice = plan.package === packageDrenagem ? 1200 : 900;
        await admin.from("budget_items").insert({
          budget_id: budget.id,
          clinic_id: clinicId,
          procedure_id: null,
          package_id: plan.package.id,
          quantity: 1,
          unit_price: unitPrice,
          discount: 0,
          professional_id: plan.professional,
          commission: Math.round(unitPrice * 0.1),
        });
        itemsTotal += unitPrice;
      } else {
        for (const item of plan.items) {
          const unitPrice = procedureDefs.find((p) => p.name === item.proc).price;
          await admin.from("budget_items").insert({
            budget_id: budget.id,
            clinic_id: clinicId,
            procedure_id: procByName[item.proc],
            package_id: null,
            quantity: item.qty,
            unit_price: unitPrice,
            discount: 0,
            professional_id: item.professional,
            commission: Math.round(unitPrice * item.qty * 0.1),
          });
          itemsTotal += unitPrice * item.qty;
        }
      }

      await admin.from("budgets").update({ total_value: itemsTotal }).eq("id", budget.id);

      if (plan.convertToSale) {
        const { data: sale, error: saleErr } = await admin
          .from("sales")
          .insert({
            clinic_id: clinicId,
            patient_id: plan.patient.id,
            budget_id: budget.id,
            total_value: itemsTotal,
            sale_date: todayPlusDays(-5),
          })
          .select("id")
          .single();
        if (saleErr) throw saleErr;

        await admin.from("financial_entries").insert({
          clinic_id: clinicId,
          patient_id: plan.patient.id,
          sale_id: sale.id,
          type: "revenue",
          description: plan.package ? `Venda de pacote — ${plan.patient.name}` : `Venda de orçamento — ${plan.patient.name}`,
          amount: itemsTotal,
          due_date: todayPlusDays(-5),
          payment_date: todayPlusDays(-5),
          status: "paid",
          payment_method: "pix",
        });

        if (plan.package) {
          const totalSessions = plan.package === packageDrenagem ? 10 : 6;
          const validityDays = plan.package === packageDrenagem ? 180 : 365;
          const { data: balance, error: balErr } = await admin
            .from("package_balances")
            .insert({
              clinic_id: clinicId,
              patient_id: plan.patient.id,
              package_id: plan.package.id,
              sale_id: sale.id,
              total_sessions: totalSessions,
              expires_at: todayPlusDays(validityDays),
            })
            .select("id")
            .single();
          if (balErr) throw balErr;

          const procedureForPackage = plan.package === packageDrenagem ? "Drenagem Linfática" : "Depilação a Laser (sessão)";
          const sessions = [
            { offset: -4, status: "done" },
            { offset: -1, status: "done" },
            { offset: 3, status: "scheduled" },
          ].map((s) => ({
            clinic_id: clinicId,
            patient_id: plan.patient.id,
            professional_id: plan.professional,
            procedure_id: procByName[procedureForPackage],
            package_balance_id: balance.id,
            session_date: todayPlusDays(s.offset),
            status: s.status,
          }));
          await admin.from("sessions").insert(sessions);
        }
      }
    }
  }

  // ---------------------------------------------------------------------
  // 9. Financeiro — lançamentos avulsos (despesas/receitas)
  // ---------------------------------------------------------------------
  console.log("Criando lançamentos financeiros avulsos...");
  const { data: existingEntries } = await admin
    .from("financial_entries")
    .select("description")
    .eq("clinic_id", clinicId);
  const existingDescs = new Set((existingEntries ?? []).map((e) => e.description));

  const standaloneEntries = [
    { type: "expense", description: "Aluguel da clínica", amount: 4500, due_date: todayPlusDays(-2), payment_date: todayPlusDays(-2), status: "paid", payment_method: "bank_transfer" },
    { type: "expense", description: "Compra de insumos (ácidos e agulhas)", amount: 1280, due_date: todayPlusDays(-8), payment_date: todayPlusDays(-8), status: "paid", payment_method: "credit_card" },
    { type: "expense", description: "Marketing — tráfego pago", amount: 900, due_date: todayPlusDays(1), payment_date: null, status: "pending", payment_method: null },
    { type: "expense", description: "Folha de pagamento — equipe", amount: 6200, due_date: todayPlusDays(-15), payment_date: null, status: "overdue", payment_method: null },
    { type: "revenue", description: "Venda avulsa — Massagem Modeladora", amount: 130, due_date: todayPlusDays(-3), payment_date: todayPlusDays(-3), status: "paid", payment_method: "debit_card" },
    { type: "revenue", description: "Venda avulsa — Radiofrequência Facial", amount: 220, due_date: todayPlusDays(2), payment_date: null, status: "pending", payment_method: null },
  ].filter((e) => !existingDescs.has(e.description));

  if (standaloneEntries.length) {
    await admin.from("financial_entries").insert(standaloneEntries.map((e) => ({ clinic_id: clinicId, ...e })));
  }

  // ---------------------------------------------------------------------
  // 10. Regras de comissão
  // ---------------------------------------------------------------------
  console.log("Criando regras de comissão...");
  const { count: commissionCount } = await admin
    .from("commission_rules")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", clinicId);

  if (!commissionCount) {
    await admin.from("commission_rules").insert([
      { clinic_id: clinicId, professional_id: null, procedure_id: null, basis: "sold", rate_percent: 10 },
      { clinic_id: clinicId, professional_id: team.amanda, procedure_id: procByName["Botox (por região)"], basis: "sold", rate_percent: 15 },
      { clinic_id: clinicId, professional_id: team.rafael, procedure_id: procByName["Preenchimento Labial"], basis: "received", rate_percent: 12 },
      { clinic_id: clinicId, professional_id: team.camila, procedure_id: procByName["Drenagem Linfática"], basis: "sold", rate_percent: 8 },
    ]);
  }

  // ---------------------------------------------------------------------
  // 11. Meta mensal
  // ---------------------------------------------------------------------
  console.log("Criando meta do mês...");
  const yearMonth = currentYearMonth();
  const { data: existingGoal } = await admin
    .from("monthly_goals")
    .select("id")
    .eq("clinic_id", clinicId)
    .eq("year_month", yearMonth)
    .maybeSingle();

  if (!existingGoal) {
    await admin.from("monthly_goals").insert({ clinic_id: clinicId, year_month: yearMonth, goal_amount: 25000 });
  }

  // ---------------------------------------------------------------------
  // 12. Estoque
  // ---------------------------------------------------------------------
  console.log("Criando produtos de estoque...");
  const { count: productCount } = await admin
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", clinicId);

  if (!productCount) {
    const products = [
      { name: "Ácido Hialurônico 1ml", category: "Preenchimento", quantity: 8, unit: "un", batch: "AH2306", expiration_date: todayPlusDays(300), cost: 180, price: 400, min_stock: 5, notes: null },
      { name: "Toxina Botulínica 100U", category: "Botox", quantity: 3, unit: "un", batch: "TB4471", expiration_date: todayPlusDays(180), cost: 350, price: 800, min_stock: 5, notes: "Estoque abaixo do mínimo." },
      { name: "Ácido Glicólico 70%", category: "Peeling", quantity: 12, unit: "frasco", batch: "AG9981", expiration_date: todayPlusDays(400), cost: 45, price: 90, min_stock: 4, notes: null },
      { name: "Agulha para Microagulhamento", category: "Descartáveis", quantity: 40, unit: "un", batch: "AM1122", expiration_date: todayPlusDays(500), cost: 8, price: null, min_stock: 20, notes: null },
      { name: "Creme Hidratante Pós-Procedimento", category: "Cosméticos", quantity: 15, unit: "un", batch: "CH3345", expiration_date: todayPlusDays(600), cost: 25, price: 60, min_stock: 6, notes: null },
      { name: "Luvas de Procedimento (caixa)", category: "Descartáveis", quantity: 2, unit: "caixa", batch: "LP7789", expiration_date: null, cost: 35, price: null, min_stock: 5, notes: "Repor com urgência." },
      { name: "Gel Condutor para Radiofrequência", category: "Insumos", quantity: 9, unit: "frasco", batch: "GC5567", expiration_date: todayPlusDays(250), cost: 30, price: null, min_stock: 3, notes: null },
      { name: "Óleo para Massagem Modeladora", category: "Insumos", quantity: 18, unit: "frasco", batch: "OM2233", expiration_date: todayPlusDays(350), cost: 20, price: null, min_stock: 5, notes: null },
      { name: "Protetor Solar FPS 60", category: "Cosméticos", quantity: 22, unit: "un", batch: "PS8890", expiration_date: todayPlusDays(450), cost: 28, price: 70, min_stock: 8, notes: null },
      { name: "Fio de PDO (kit)", category: "Fios", quantity: 1, unit: "kit", batch: "FP0012", expiration_date: todayPlusDays(200), cost: 220, price: 600, min_stock: 3, notes: "Estoque crítico." },
      { name: "Sérum Vitamina C", category: "Cosméticos", quantity: 14, unit: "un", batch: "SV4432", expiration_date: todayPlusDays(500), cost: 32, price: 85, min_stock: 5, notes: null },
      { name: "Máscara Alginato Facial", category: "Descartáveis", quantity: 30, unit: "un", batch: "MA7765", expiration_date: todayPlusDays(365), cost: 12, price: null, min_stock: 10, notes: null },
    ];
    await admin.from("products").insert(products.map((p) => ({ clinic_id: clinicId, status: "active", ...p })));
  }

  // ---------------------------------------------------------------------
  // 13. Modelos de anamnese padrão (backfill — clínicas novas já ganham
  // isso automaticamente no cadastro, via src/actions/auth.ts)
  // ---------------------------------------------------------------------
  console.log("Criando modelos de anamnese padrão...");
  const { data: existingAnamnesisTemplates } = await admin
    .from("anamnesis_templates")
    .select("name")
    .eq("clinic_id", clinicId);
  const existingAnamnesisNames = new Set((existingAnamnesisTemplates ?? []).map((t) => t.name));

  {
    const defaultTemplates = [
      {
        name: "Anamnese Facial",
        questions: [
          { label: "Qual é o seu tipo de pele?", type: "single_choice", required: true, options: ["Oleosa", "Seca", "Mista", "Normal", "Sensível"] },
          { label: "Possui alguma alergia conhecida (cosméticos, medicamentos, látex, etc.)?", type: "yes_no_unsure", required: true, options: [] },
          { label: "Se sim, quais alergias?", type: "long_text", required: false, options: [] },
          { label: "Está grávida ou amamentando?", type: "yes_no_unsure", required: true, options: [] },
          { label: "Usa alguma medicação contínua? Qual?", type: "long_text", required: true, options: [] },
          { label: "Já realizou procedimentos estéticos faciais anteriormente?", type: "yes_no", required: true, options: [] },
          { label: "Se sim, quais procedimentos e quando?", type: "long_text", required: false, options: [] },
          { label: "Tem histórico de queloide ou cicatrização anormal?", type: "yes_no", required: true, options: [] },
          { label: "Como você descreveria sua exposição solar no dia a dia?", type: "single_choice", required: true, options: ["Baixa", "Moderada", "Alta"] },
          { label: "Qual sua expectativa em relação ao procedimento?", type: "long_text", required: false, options: [] },
        ],
      },
      {
        name: "Anamnese Corporal",
        questions: [
          { label: "Possui alguma condição de saúde crônica (diabetes, hipertensão, tireoide, etc.)?", type: "yes_no_unsure", required: true, options: [] },
          { label: "Se sim, quais condições?", type: "long_text", required: false, options: [] },
          { label: "Está grávida ou amamentando?", type: "yes_no_unsure", required: true, options: [] },
          { label: "Já realizou cirurgias na região que será tratada?", type: "yes_no", required: true, options: [] },
          { label: "Se sim, detalhe as cirurgias e datas aproximadas.", type: "long_text", required: false, options: [] },
          { label: "Tem histórico de queloide ou cicatrização anormal?", type: "yes_no", required: true, options: [] },
          { label: "Com que frequência pratica atividade física?", type: "single_choice", required: false, options: ["Não pratica", "1 a 2x por semana", "3 a 4x por semana", "5x ou mais por semana"] },
          { label: "Possui marca-passo, prótese metálica ou implante na região?", type: "yes_no", required: true, options: [] },
          { label: "Possui alguma alergia conhecida?", type: "long_text", required: false, options: [] },
          { label: "Qual sua expectativa em relação ao procedimento?", type: "long_text", required: false, options: [] },
        ],
      },
    ];

    for (const template of defaultTemplates) {
      if (existingAnamnesisNames.has(template.name)) continue;

      const { data: inserted, error } = await admin
        .from("anamnesis_templates")
        .insert({ clinic_id: clinicId, name: template.name })
        .select("id")
        .single();
      if (error || !inserted) continue;

      await admin.from("anamnesis_questions").insert(
        template.questions.map((q, index) => ({
          template_id: inserted.id,
          clinic_id: clinicId,
          label: q.label,
          type: q.type,
          required: q.required,
          options: q.options,
          position: index,
        })),
      );
    }
  }

  // ---------------------------------------------------------------------
  // 14. Termo de consentimento padrão (backfill — requer a migration
  // 0011_consent_templates.sql já aplicada no Supabase)
  // ---------------------------------------------------------------------
  console.log("Criando termo de consentimento padrão...");
  const { data: existingConsentTemplates, error: consentCheckError } = await admin
    .from("consent_templates")
    .select("id")
    .eq("clinic_id", clinicId)
    .limit(1);

  if (consentCheckError) {
    console.log(
      "  Aviso: tabela consent_templates não encontrada — rode a migration supabase/migrations/0011_consent_templates.sql no Supabase antes.",
    );
  } else if (!existingConsentTemplates || existingConsentTemplates.length === 0) {
    const defaultConsentText = `Declaro que fui informado(a) de forma clara sobre o(s) procedimento(s) estético(s) que serão
realizados nesta clínica, incluindo seus objetivos, benefícios esperados, possíveis riscos,
efeitos colaterais e cuidados necessários antes e depois do atendimento.

Autorizo a realização dos procedimentos indicados pela equipe da clínica, estando ciente de
que os resultados podem variar de pessoa para pessoa.

Autorizo também o uso de fotografias e vídeos feitos antes, durante e depois dos
procedimentos, exclusivamente para fins de acompanhamento clínico, prontuário e,
mediante meu consentimento adicional caso solicitado, para divulgação em materiais da
clínica.

Declaro que as informações prestadas por mim sobre meu histórico de saúde são verdadeiras
e completas.`;

    const { error: consentInsertError } = await admin
      .from("consent_templates")
      .insert({ clinic_id: clinicId, content: defaultConsentText });

    if (consentInsertError) {
      console.log(`  Aviso: não foi possível salvar o termo padrão (${consentInsertError.message}).`);
    }
  }

  console.log("\nSeed concluído com sucesso.");
  console.log(`Clínica: ${clinicId}`);
  console.log(`Login owner: ${TARGET_EMAIL} (senha já existente)`);
  console.log(`Login demo dos profissionais/equipe: senha "${DEMO_PASSWORD}" para todos os e-mails *.demo@esteticaos.app`);
}

main().catch((err) => {
  console.error("Erro no seed:", err);
  process.exit(1);
});
