import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateUserDialog } from "@/components/users/CreateUserDialog";
import { MemberActions } from "@/components/users/MemberActions";
import { MemberColorPicker } from "@/components/users/MemberColorPicker";
import { MemberProfession } from "@/components/users/MemberProfession";
import { MemberRoleSelect } from "@/components/users/MemberRoleSelect";
import { type ClinicRole, type Permissions } from "@/lib/auth/permissions";
import { SettingsBackLink } from "@/components/settings/SettingsBackLink";

export const metadata = { title: "Usuários e permissões — EstéticaOS" };

export default async function UsuariosPage() {
  const member = await requirePermission("settings_access");
  const isOwner = member.role === "owner";

  const supabase = await createClient();
  const { data: members } = await supabase
    .from("clinic_members")
    .select("user_id, full_name, email, role, profession, permissions, status, color")
    .eq("clinic_id", member.clinicId)
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-4">
      <SettingsBackLink />
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
                <TableHead className="hidden lg:table-cell">E-mail</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Profissão</TableHead>
                <TableHead>Cor na agenda</TableHead>
                <TableHead>Status</TableHead>
                {isOwner && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members?.map((m) => (
                <TableRow key={m.user_id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {m.full_name}
                    {/* Em telas estreitas o e-mail vem embaixo do nome em vez
                        de espremer mais uma coluna. */}
                    <span className="block text-xs font-normal text-muted-foreground lg:hidden">
                      {m.email}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {m.email}
                  </TableCell>
                  <TableCell>
                    <MemberRoleSelect
                      userId={m.user_id}
                      role={m.role as ClinicRole}
                      canEdit={isOwner}
                    />
                  </TableCell>
                  <TableCell>
                    <MemberProfession
                      userId={m.user_id}
                      profession={(m.profession as string | null) ?? null}
                      canEdit={isOwner}
                    />
                  </TableCell>
                  <TableCell>
                    <MemberColorPicker
                      userId={m.user_id}
                      color={(m.color as string | null) ?? null}
                      canEdit={isOwner}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.status === "active" ? "default" : "outline"}>
                      {m.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  {isOwner && (
                    <TableCell className="text-right whitespace-nowrap">
                      {m.role === "owner" ? (
                        <span className="text-sm text-muted-foreground">—</span>
                      ) : (
                        <MemberActions
                          userId={m.user_id}
                          name={m.full_name}
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
