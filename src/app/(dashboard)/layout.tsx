import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/auth/session";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const member = await getCurrentMember();

  // Sem sessão: volta para o login. Com sessão mas sem vínculo ativo com
  // uma clínica, vai para uma página pública dedicada — redirecionar para
  // /login criaria loop, pois o proxy manda usuário logado de volta a /hoje.
  if (!member) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/login");
    }
    redirect("/conta-desativada?motivo=sem-clinica");
  }

  if (member.memberStatus === "inactive") {
    redirect("/conta-desativada");
  }

  return (
    <TooltipProvider>
      <div className="flex min-h-screen">
        <div className="print:hidden">
          <Sidebar clinicName={member.clinicName} role={member.role} permissions={member.permissions} />
        </div>
        <div className="flex min-h-screen flex-1 flex-col">
          <div className="print:hidden">
            <Topbar
              clinicName={member.clinicName}
              fullName={member.fullName}
              email={member.email}
              role={member.role}
              permissions={member.permissions}
            />
          </div>
          <main className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-6 print:overflow-visible print:bg-white print:p-0">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
