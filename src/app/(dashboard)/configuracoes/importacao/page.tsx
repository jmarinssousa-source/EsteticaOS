import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { IMPORT_TEMPLATES } from "@/lib/importacao/types";
import { importAppointments, importFinancialEntries, importPatients, importProcedures } from "@/actions/importacao";
import {
  exportAppointments,
  exportFinancialEntries,
  exportPatients,
  exportProcedures,
} from "@/actions/exportacao";
import { ImportCard } from "@/components/importacao/ImportCard";
import { ExportCard } from "@/components/importacao/ExportCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata = { title: "Importação/Exportação — EstéticaOS" };

export default async function ImportacaoPage() {
  const member = await requirePermission("settings_access");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Importação/Exportação</h1>
        <p className="text-sm text-muted-foreground">
          Importe dados de uma planilha ou exporte os dados da clínica em CSV ou Excel.
        </p>
      </div>

      <Tabs defaultValue="importar">
        <TabsList>
          <TabsTrigger value="importar">Importar</TabsTrigger>
          <TabsTrigger value="exportar">Exportar</TabsTrigger>
        </TabsList>

        <TabsContent value="importar" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Baixe o modelo de planilha (CSV), preencha e envie de volta. Importe primeiro os
            Pacientes e os Procedimentos — Agenda e Financeiro dependem deles para vincular os
            registros corretamente.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {hasPermission(member, "patients_edit") && (
              <ImportCard
                type="patients"
                label={IMPORT_TEMPLATES.patients.label}
                description={IMPORT_TEMPLATES.patients.description}
                action={importPatients}
              />
            )}
            {hasPermission(member, "budgets_edit") && (
              <ImportCard
                type="procedures"
                label={IMPORT_TEMPLATES.procedures.label}
                description={IMPORT_TEMPLATES.procedures.description}
                action={importProcedures}
              />
            )}
            {hasPermission(member, "agenda_edit") && (
              <ImportCard
                type="appointments"
                label={IMPORT_TEMPLATES.appointments.label}
                description={IMPORT_TEMPLATES.appointments.description}
                action={importAppointments}
              />
            )}
            {hasPermission(member, "finance_edit") && (
              <ImportCard
                type="financial"
                label={IMPORT_TEMPLATES.financial.label}
                description={IMPORT_TEMPLATES.financial.description}
                action={importFinancialEntries}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="exportar" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Exporte os dados da clínica para planilha, em CSV (texto) ou Excel.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {hasPermission(member, "patients_edit") && (
              <ExportCard
                label="Pacientes"
                description="Nome, contato, CPF, endereço e origem."
                filename="pacientes"
                action={exportPatients}
              />
            )}
            {hasPermission(member, "budgets_edit") && (
              <ExportCard
                label="Procedimentos"
                description="Nome, preço e duração."
                filename="procedimentos"
                action={exportProcedures}
              />
            )}
            {hasPermission(member, "agenda_edit") && (
              <ExportCard
                label="Agendamentos"
                description="Data, paciente, procedimento e status."
                filename="agendamentos"
                action={exportAppointments}
              />
            )}
            {hasPermission(member, "finance_edit") && (
              <ExportCard
                label="Financeiro"
                description="Lançamentos de receita e despesa."
                filename="financeiro"
                action={exportFinancialEntries}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
