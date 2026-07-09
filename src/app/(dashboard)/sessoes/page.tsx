import { hasPermission } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getPackageBalancesWithUsage } from "@/lib/sessions/queries";
import type { Session } from "@/lib/sessions/types";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SessionFormDialog } from "@/components/sessions/SessionFormDialog";
import { SessionRow } from "@/components/sessions/SessionRow";

export const metadata = { title: "Sessões — EstéticaOS" };

export default async function SessoesPage() {
  const member = await requirePermission("sessions_view");
  const canEdit = hasPermission(member, "sessions_edit");

  const supabase = await createClient();
  const [{ data: sessions }, { data: patients }, { data: professionals }, { data: procedures }] =
    await Promise.all([
      supabase
        .from("sessions")
        .select(
          "id, patient_id, professional_id, procedure_id, package_balance_id, session_date, status, notes, patient_signature, patient_signed_at, professional_signature, professional_signed_at, created_at",
        )
        .eq("clinic_id", member.clinicId)
        .order("session_date", { ascending: false }),
      supabase.from("patients").select("id, name").eq("clinic_id", member.clinicId).order("name"),
      supabase
        .from("clinic_members")
        .select("user_id, full_name")
        .eq("clinic_id", member.clinicId)
        .eq("status", "active")
        .order("full_name"),
      supabase.from("procedures").select("id, name, price").eq("clinic_id", member.clinicId).order("name"),
    ]);

  const packageBalances = await getPackageBalancesWithUsage(supabase, member.clinicId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sessões</h1>
          <p className="text-sm text-muted-foreground">
            Sessões avulsas ou vinculadas a um pacote, com assinatura do paciente e do profissional.
          </p>
        </div>
        {canEdit && (
          <SessionFormDialog
            patients={patients ?? []}
            professionals={professionals ?? []}
            procedures={procedures ?? []}
            packageBalances={packageBalances}
          />
        )}
      </div>

      <Card>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
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
                  patients={patients ?? []}
                  professionals={professionals ?? []}
                  procedures={procedures ?? []}
                  packageBalances={packageBalances}
                  canEdit={canEdit}
                />
              ))}
            </TableBody>
          </Table>
          {(!sessions || sessions.length === 0) && (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma sessão registrada ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
