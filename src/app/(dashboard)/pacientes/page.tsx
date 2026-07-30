import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { hasPermission } from "@/lib/auth/permissions";
import { Button } from "@/components/ui/button";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PatientFormDialog } from "@/components/patients/PatientFormDialog";
import { PatientsTable } from "@/components/patients/PatientsTable";
import {
  buildPatientSearchFilter,
  parsePage,
  parsePageSize,
} from "@/lib/patients/search";

export const metadata = { title: "Pacientes — EstéticaOS" };

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; size?: string }>;
}) {
  const [params, member] = await Promise.all([searchParams, requirePermission("patients_view")]);
  const canEdit = hasPermission(member, "patients_edit");
  // Apagar prontuário é decisão de quem administra a clínica.
  const canDelete = canEdit && (member.role === "owner" || member.role === "manager");

  const search = params.q?.trim() ?? "";
  const pageSize = parsePageSize(params.size);
  const requestedPage = parsePage(params.page);
  const filter = buildPatientSearchFilter(search);

  const supabase = await createClient();

  // A busca e a contagem rodam no banco, não no navegador. Antes a tela
  // pedia "todos os pacientes" e paginava o que chegasse — só que o
  // PostgREST corta em 1000 linhas, então uma base de 3 mil virava
  // "1000 pacientes" e a busca só enxergava esse pedaço.
  function buildQuery(head: boolean) {
    let query = supabase
      .from("patients")
      .select("id, name, phone, email, cpf", { count: "exact", head })
      .eq("clinic_id", member.clinicId);
    if (filter) query = query.or(filter);
    return query;
  }

  const { count: totalCount } = await supabase
    .from("patients")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", member.clinicId);

  const { count: matchCount } = filter
    ? await buildQuery(true)
    : { count: totalCount };

  const total = matchCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const from = (page - 1) * pageSize;

  const { data: patients } = await buildQuery(false)
    .order("name", { ascending: true })
    .range(from, from + pageSize - 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-sm text-muted-foreground">
            {totalCount ?? 0} paciente{totalCount === 1 ? "" : "s"} cadastrado
            {totalCount === 1 ? "" : "s"} nesta clínica.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/pacientes/reativacao" />}
          >
            <HeartHandshake className="size-4" />
            Reativação
          </Button>
          {canEdit && <PatientFormDialog />}
        </div>
      </div>

      <PatientsTable
        patients={patients ?? []}
        canDelete={canDelete}
        search={search}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        matchCount={total}
        totalCount={totalCount ?? 0}
      />
    </div>
  );
}
