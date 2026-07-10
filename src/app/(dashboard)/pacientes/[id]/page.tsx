import Link from "next/link";
import { notFound } from "next/navigation";
import { hasPermission } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import { LEAD_ORIGIN_LABELS, type LeadOrigin } from "@/lib/crm/constants";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/agenda/constants";
import { BUDGET_STATUS_LABELS, type BudgetStatus } from "@/lib/orcamentos/constants";
import { getPackageBalancesWithUsage } from "@/lib/sessions/queries";
import { getSignedMediaUrls } from "@/lib/prontuario/queries";
import type { Session } from "@/lib/sessions/types";
import type { Appointment } from "@/lib/agenda/types";
import type { PatientRecord, PatientPhoto } from "@/lib/prontuario/types";
import type { FinancialEntry } from "@/lib/financeiro/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PatientResumeForm } from "@/components/patients/PatientResumeForm";
import { AnamnesisTab } from "@/components/anamnesis/AnamnesisTab";
import { SessionFormDialog } from "@/components/sessions/SessionFormDialog";
import { SessionRow } from "@/components/sessions/SessionRow";
import { ConsentTab } from "@/components/consent/ConsentTab";
import { getConsentTemplate } from "@/actions/consent";
import { RecordFormDialog } from "@/components/prontuario/RecordFormDialog";
import { RecordHistory } from "@/components/prontuario/RecordHistory";
import { PhotoUploadDialog } from "@/components/prontuario/PhotoUploadDialog";
import { PhotosGallery } from "@/components/prontuario/PhotosGallery";
import { EntryFormDialog } from "@/components/financeiro/EntryFormDialog";
import { EntryRow } from "@/components/financeiro/EntryRow";
import type { ResponseStatus } from "@/lib/anamnesis/constants";

export const metadata = { title: "Paciente — EstéticaOS" };

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await requirePermission("patients_view");
  const canEditPatient = hasPermission(member, "patients_edit");
  const canViewCrm = hasPermission(member, "crm_view");
  const canViewAgenda = hasPermission(member, "agenda_view");
  const canViewBudgets = hasPermission(member, "budgets_view");
  const canViewSessions = hasPermission(member, "sessions_view");
  const canEditSessions = hasPermission(member, "sessions_edit");
  const canViewRecords = hasPermission(member, "records_view");
  const canEditRecords = hasPermission(member, "records_edit");
  const canViewFinance = hasPermission(member, "finance_view");
  const canEditFinance = hasPermission(member, "finance_edit");

  const supabase = await createClient();
  const { data: patient } = await supabase
    .from("patients")
    .select("id, lead_id, name, phone, email, cpf, birth_date, gender, address, origin, notes, created_at")
    .eq("id", id)
    .eq("clinic_id", member.clinicId)
    .maybeSingle();

  if (!patient) notFound();

  const [
    { data: templates },
    { data: responses },
    leadResult,
    { data: appointments },
    { data: budgets },
    { data: sessions },
    { data: professionals },
    { data: procedures },
    { data: consent },
    { data: records },
    { data: photos },
    { data: financialEntries },
  ] = await Promise.all([
    supabase
      .from("anamnesis_templates")
      .select("id, name")
      .eq("clinic_id", member.clinicId)
      .eq("active", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("anamnesis_responses")
      .select("id, status, created_at, anamnesis_templates(name)")
      .eq("patient_id", patient.id)
      .order("created_at", { ascending: false }),
    patient.lead_id
      ? supabase
          .from("leads")
          .select("id, status, potential_value, next_action, lead_interactions(id, note, created_at)")
          .eq("id", patient.lead_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    canViewAgenda
      ? supabase
          .from("appointments")
          .select("id, professional_id, procedure_id, appointment_date, start_time, end_time, status")
          .eq("patient_id", id)
          .eq("clinic_id", member.clinicId)
          .order("appointment_date", { ascending: false })
      : Promise.resolve({ data: null }),
    canViewBudgets
      ? supabase
          .from("budgets")
          .select("id, status, total_value, created_at")
          .eq("patient_id", id)
          .eq("clinic_id", member.clinicId)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: null }),
    canViewSessions
      ? supabase
          .from("sessions")
          .select(
            "id, patient_id, professional_id, procedure_id, package_balance_id, session_date, status, notes, patient_signature, patient_signed_at, professional_signature, professional_signed_at, created_at",
          )
          .eq("patient_id", id)
          .eq("clinic_id", member.clinicId)
          .order("session_date", { ascending: false })
      : Promise.resolve({ data: null }),
    supabase
      .from("clinic_members")
      .select("user_id, full_name")
      .eq("clinic_id", member.clinicId)
      .eq("status", "active")
      .order("full_name"),
    supabase.from("procedures").select("id, name, price").eq("clinic_id", member.clinicId).order("name"),
    supabase
      .from("consent_forms")
      .select("patient_signature, signed_at")
      .eq("patient_id", id)
      .eq("clinic_id", member.clinicId)
      .order("signed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    canViewRecords
      ? supabase
          .from("patient_records")
          .select(
            "id, patient_id, professional_id, procedure_id, record_date, notes, map_type, map_image_path, complication, created_at",
          )
          .eq("patient_id", id)
          .eq("clinic_id", member.clinicId)
          .order("record_date", { ascending: false })
      : Promise.resolve({ data: null }),
    canViewRecords
      ? supabase
          .from("patient_photos")
          .select("id, patient_id, record_id, storage_path, label, photo_type, created_at")
          .eq("patient_id", id)
          .eq("clinic_id", member.clinicId)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: null }),
    canViewFinance
      ? supabase
          .from("financial_entries")
          .select(
            "id, patient_id, sale_id, type, description, amount, due_date, payment_date, status, payment_method, commission_amount, nf_issued, nf_number, created_at",
          )
          .eq("patient_id", id)
          .eq("clinic_id", member.clinicId)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: null }),
  ]);

  const consentTemplate = await getConsentTemplate();

  const signedMediaUrls = canViewRecords
    ? await getSignedMediaUrls(supabase, [
        ...(records ?? []).map((r) => r.map_image_path).filter((p): p is string => Boolean(p)),
        ...(photos ?? []).map((p) => p.storage_path),
      ])
    : {};

  const packageBalances = canViewSessions
    ? await getPackageBalancesWithUsage(supabase, member.clinicId, id)
    : [];

  const lead = leadResult.data;

  const formattedResponses = (responses ?? []).map((r) => ({
    id: r.id,
    status: r.status as ResponseStatus,
    created_at: r.created_at,
    template_name: (r.anamnesis_templates as unknown as { name: string } | null)?.name ?? "—",
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{patient.name}</h1>
        <p className="text-sm text-muted-foreground">
          Paciente desde {new Date(patient.created_at).toLocaleDateString("pt-BR")}
          {patient.origin && ` · Origem: ${LEAD_ORIGIN_LABELS[patient.origin as LeadOrigin] ?? patient.origin}`}
        </p>
      </div>

      <Tabs defaultValue="resumo">
        <TabsList className="flex-wrap">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          {canViewCrm && <TabsTrigger value="crm">CRM</TabsTrigger>}
          {canViewAgenda && <TabsTrigger value="agenda">Agenda</TabsTrigger>}
          <TabsTrigger value="anamnese">Anamnese</TabsTrigger>
          {canViewRecords && <TabsTrigger value="prontuario">Prontuário</TabsTrigger>}
          {canViewBudgets && <TabsTrigger value="orcamentos">Orçamentos</TabsTrigger>}
          {canViewSessions && <TabsTrigger value="sessoes">Sessões</TabsTrigger>}
          {canViewFinance && <TabsTrigger value="financeiro">Financeiro</TabsTrigger>}
          {canViewRecords && <TabsTrigger value="fotos">Fotos</TabsTrigger>}
          <TabsTrigger value="assinaturas">Assinaturas</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="pt-4">
          <PatientResumeForm patientId={patient.id} patient={patient} canEdit={canEditPatient} />
        </TabsContent>

        {canViewCrm && (
          <TabsContent value="crm" className="pt-4">
            {!lead ? (
              <p className="text-sm text-muted-foreground">
                Este paciente foi cadastrado diretamente, sem passar pelo CRM.
              </p>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    Origem no CRM
                    <Badge variant="secondary">{lead.status}</Badge>
                  </CardTitle>
                  <CardDescription>
                    {lead.potential_value != null && `Valor potencial: ${formatCurrency(lead.potential_value)}`}
                    {lead.next_action && ` · Próxima ação: ${lead.next_action}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm font-medium">Histórico de interações</p>
                  {lead.lead_interactions.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhuma interação registrada.</p>
                  )}
                  {lead.lead_interactions
                    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
                    .map((interaction) => (
                      <div key={interaction.id} className="rounded-md border p-2 text-sm">
                        <p>{interaction.note}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(interaction.created_at).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {canViewAgenda && (
          <TabsContent value="agenda" className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(appointments as Appointment[] | null)?.map((appointment) => {
                  const professional = professionals?.find((p) => p.user_id === appointment.professional_id);
                  return (
                    <TableRow key={appointment.id}>
                      <TableCell>{new Date(appointment.appointment_date).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        {appointment.start_time.slice(0, 5)}–{appointment.end_time.slice(0, 5)}
                      </TableCell>
                      <TableCell>{professional?.full_name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{APPOINTMENT_STATUS_LABELS[appointment.status]}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {(!appointments || appointments.length === 0) && (
              <p className="py-6 text-center text-sm text-muted-foreground">Nenhum agendamento ainda.</p>
            )}
          </TabsContent>
        )}

        <TabsContent value="anamnese" className="pt-4">
          <AnamnesisTab
            patientId={patient.id}
            templates={templates ?? []}
            responses={formattedResponses}
            canEdit={canEditPatient}
          />
        </TabsContent>

        {canViewRecords && (
          <TabsContent value="prontuario" className="space-y-4 pt-4">
            {canEditRecords && (
              <div className="flex justify-end">
                <RecordFormDialog patientId={patient.id} procedures={procedures ?? []} />
              </div>
            )}
            <RecordHistory
              records={(records ?? []) as PatientRecord[]}
              procedures={procedures ?? []}
              signedMapUrls={signedMediaUrls}
            />
          </TabsContent>
        )}

        {canViewBudgets && (
          <TabsContent value="orcamentos" className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets?.map((budget) => (
                  <TableRow key={budget.id} className="cursor-pointer">
                    <TableCell>
                      <Link href={`/orcamentos/${budget.id}`} className="block">
                        <Badge variant="secondary">{BUDGET_STATUS_LABELS[budget.status as BudgetStatus]}</Badge>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/orcamentos/${budget.id}`} className="block">
                        {formatCurrency(Number(budget.total_value))}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/orcamentos/${budget.id}`} className="block">
                        {new Date(budget.created_at).toLocaleDateString("pt-BR")}
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {(!budgets || budgets.length === 0) && (
              <p className="py-6 text-center text-sm text-muted-foreground">Nenhum orçamento ainda.</p>
            )}
          </TabsContent>
        )}

        {canViewSessions && (
          <TabsContent value="sessoes" className="space-y-4 pt-4">
            {packageBalances.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {packageBalances.map((balance) => (
                  <Badge key={balance.id} variant="outline">
                    {balance.package_name}: {balance.total_sessions - balance.used_sessions}/
                    {balance.total_sessions} sessões restantes
                  </Badge>
                ))}
              </div>
            )}

            {canEditSessions && (
              <div className="flex justify-end">
                <SessionFormDialog
                  patients={[{ id: patient.id, name: patient.name }]}
                  professionals={professionals ?? []}
                  procedures={procedures ?? []}
                  packageBalances={packageBalances}
                  fixedPatientId={patient.id}
                />
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Procedimento</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assinaturas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(sessions as Session[] | null)?.map((session) => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    patients={[{ id: patient.id, name: patient.name }]}
                    professionals={professionals ?? []}
                    procedures={procedures ?? []}
                    packageBalances={packageBalances}
                    canEdit={canEditSessions}
                    showPatient={false}
                  />
                ))}
              </TableBody>
            </Table>
            {(!sessions || sessions.length === 0) && (
              <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma sessão ainda.</p>
            )}
          </TabsContent>
        )}

        {canViewFinance && (
          <TabsContent value="financeiro" className="space-y-4 pt-4">
            {canEditFinance && (
              <div className="flex justify-end">
                <EntryFormDialog patients={[{ id: patient.id, name: patient.name }]} />
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(financialEntries as FinancialEntry[] | null)?.map((entry) => (
                  <EntryRow key={entry.id} entry={entry} patientName={patient.name} canEdit={canEditFinance} />
                ))}
              </TableBody>
            </Table>
            {(!financialEntries || financialEntries.length === 0) && (
              <p className="py-6 text-center text-sm text-muted-foreground">Nenhum lançamento ainda.</p>
            )}
          </TabsContent>
        )}

        {canViewRecords && (
          <TabsContent value="fotos" className="space-y-4 pt-4">
            {canEditRecords && (
              <div className="flex justify-end">
                <PhotoUploadDialog patientId={patient.id} />
              </div>
            )}
            <PhotosGallery
              patientId={patient.id}
              photos={(photos ?? []) as PatientPhoto[]}
              signedUrls={signedMediaUrls}
              canEdit={canEditRecords}
            />
          </TabsContent>
        )}

        <TabsContent value="assinaturas" className="pt-4">
          <ConsentTab
            patientId={patient.id}
            latestConsent={
              consent ? { signature: consent.patient_signature, signedAt: consent.signed_at } : null
            }
            templateContent={consentTemplate}
            canEdit={canEditPatient}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
