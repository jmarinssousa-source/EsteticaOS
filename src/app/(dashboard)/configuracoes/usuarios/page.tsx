import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateUserDialog } from "@/components/users/CreateUserDialog";
import { MemberActions } from "@/components/users/MemberActions";
import { ROLE_LABELS, type ClinicRole, type Permissions } from "@/lib/auth/permissions";

export const metadata = { title: "Usuários e permissões — EstéticaOS" };

export default async function UsuariosPage() {
  const member = await requirePermission("settings_access");
  const isOwner = member.role === "owner";

  const supabase = await createClient();
  const { data: members } = await supabase
    .from("clinic_members")
    .select("user_id, full_name, email, role, permissions, status")
    .eq("clinic_id", member.clinicId)
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Usuários e permissões</h1>
        {isOwner && <CreateUserDialog />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipe da clínica</CardTitle>
          <CardDescription>
            {isOwner
              ? "Defina o perfil de cada pessoa e ajuste manualmente o que ela pode ver ou editar."
              : "Somente o dono/admin pode alterar perfis e permissões."}
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
                {isOwner && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members?.map((m) => (
                <TableRow key={m.user_id}>
                  <TableCell className="font-medium">{m.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{m.email}</TableCell>
                  <TableCell>
                    {m.role === "owner" ? (
                      ROLE_LABELS.owner
                    ) : (
                      <Badge variant="secondary">{ROLE_LABELS[m.role as ClinicRole]}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.status === "active" ? "default" : "outline"}>
                      {m.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  {isOwner && (
                    <TableCell className="text-right">
                      {m.role === "owner" ? (
                        <span className="text-sm text-muted-foreground">—</span>
                      ) : (
                        <MemberActions
                          userId={m.user_id}
                          role={m.role as ClinicRole}
                          permissions={(m.permissions ?? {}) as Partial<Permissions>}
                          status={m.status as "active" | "inactive"}
                        />
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
