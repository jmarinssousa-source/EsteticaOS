import Link from "next/link";
import { Search } from "lucide-react";
import { hasPermission } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PatientFormDialog } from "@/components/patients/PatientFormDialog";

export const metadata = { title: "Pacientes — EstéticaOS" };

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const member = await requirePermission("patients_view");
  const canEdit = hasPermission(member, "patients_edit");
  const { q } = await searchParams;

  const supabase = await createClient();
  let query = supabase
    .from("patients")
    .select("id, name, phone, email, cpf, created_at")
    .eq("clinic_id", member.clinicId)
    .order("created_at", { ascending: false });

  if (q?.trim()) {
    const term = q.trim();
    query = query.or(`name.ilike.%${term}%,phone.ilike.%${term}%,cpf.ilike.%${term}%`);
  }

  const { data: patients } = await query;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-sm text-muted-foreground">Busque por nome, telefone ou CPF.</p>
        </div>
        {canEdit && <PatientFormDialog />}
      </div>

      <form className="flex items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" placeholder="Buscar paciente..." defaultValue={q ?? ""} className="pl-8" />
        </div>
      </form>

      <Card>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>CPF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients?.map((patient) => (
                <TableRow key={patient.id} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <Link href={`/pacientes/${patient.id}`} className="block">
                      {patient.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/pacientes/${patient.id}`} className="block">
                      {patient.phone ?? "—"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/pacientes/${patient.id}`} className="block">
                      {patient.email ?? "—"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/pacientes/${patient.id}`} className="block">
                      {patient.cpf ?? "—"}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {(!patients || patients.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    Nenhum paciente encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
