import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { IMPORT_TEMPLATES } from "@/lib/importacao/types";
import { importAppointments, importFinancialEntries, importPatients, importProcedures } from "@/actions/importacao";
import { ImportCard } from "@/components/importacao/ImportCard";

export const metadata = { title: "Importação — EstéticaOS" };

export default async function ImportacaoPage() {
  const member = await requirePermission("settings_access");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Importação de dados</h1>
        <p className="text-sm text-muted-foreground">
          Baixe o modelo de planilha (CSV), preencha e envie de volta. Importe primeiro os
          Pacientes e os Procedimentos — Agenda e Financeiro dependem deles para vincular os
          registros corretamente.
        </p>
      </div>

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
    </div>
  );
}
