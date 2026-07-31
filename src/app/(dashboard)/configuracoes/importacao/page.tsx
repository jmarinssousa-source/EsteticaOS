import { CircleCheck, Info } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsBackLink } from "@/components/settings/SettingsBackLink";

export const metadata = { title: "Importação/Exportação — EstéticaOS" };

/**
 * A ordem importa e não é óbvia: agenda e financeiro se ligam ao
 * paciente pelo nome ou pelo CPF, então uma agenda importada antes dos
 * pacientes não acha ninguém e recusa linha por linha.
 */
const IMPORT_ORDER = [
  "Pacientes, sempre primeiro. Todo o resto se liga a eles.",
  "Procedimentos, o catálogo da clínica.",
  "Agenda e Financeiro, que dependem dos dois de cima.",
];

export default async function ImportacaoPage() {
  const member = await requirePermission("settings_access");

  const canPatients = hasPermission(member, "patients_edit");
  const canProcedures = hasPermission(member, "budgets_edit");
  const canAgenda = hasPermission(member, "agenda_edit");
  const canFinance = hasPermission(member, "finance_edit");

  return (
    <div className="space-y-4">
      <SettingsBackLink />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Importação e exportação</h1>
        <p className="text-sm text-muted-foreground">
          Traga os dados que já existem em planilha para dentro do sistema, ou leve os dados da
          clínica para fora, em Excel ou CSV.
        </p>
      </div>

      <Tabs defaultValue="importar">
        <TabsList>
          <TabsTrigger value="importar">Importar</TabsTrigger>
          <TabsTrigger value="exportar">Exportar</TabsTrigger>
        </TabsList>

        <TabsContent value="importar" className="space-y-4">
          <Alert>
            <Info className="size-4" />
            <AlertDescription>
              <p className="font-medium">Como funciona, em três passos</p>
              <p className="mt-1 text-sm">
                Baixe o modelo, preencha sem mudar os nomes das colunas e envie de volta. O sistema
                lê Excel e CSV, e diz linha por linha o que entrou e o que ficou de fora.
              </p>
              <p className="mt-3 text-sm font-medium">Importe nesta ordem</p>
              <ol className="mt-1 space-y-1 text-sm">
                {IMPORT_ORDER.map((step, index) => (
                  <li key={step} className="flex gap-2">
                    <span className="text-muted-foreground">{index + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-3 flex items-start gap-2 text-sm">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span>
                  Enviar o mesmo arquivo duas vezes não duplica nada. Cada tipo tem sua regra de
                  repetição, descrita no cartão correspondente.
                </span>
              </p>
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 xl:grid-cols-2">
            {canPatients && (
              <ImportCard template={IMPORT_TEMPLATES.patients} action={importPatients} />
            )}
            {canProcedures && (
              <ImportCard template={IMPORT_TEMPLATES.procedures} action={importProcedures} />
            )}
            {canAgenda && (
              <ImportCard template={IMPORT_TEMPLATES.appointments} action={importAppointments} />
            )}
            {canFinance && (
              <ImportCard template={IMPORT_TEMPLATES.financial} action={importFinancialEntries} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="exportar" className="space-y-4">
          <Alert>
            <Info className="size-4" />
            <AlertDescription>
              O arquivo é gerado na hora, com os dados desta clínica, e baixa direto no seu
              computador. Excel (.xlsx) abre com um duplo clique; CSV é texto puro, e serve para
              levar os dados a outro sistema.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 sm:grid-cols-2">
            {canPatients && (
              <ExportCard
                label="Pacientes"
                description="Todo o cadastro, uma linha por paciente."
                columns={[
                  "Nome",
                  "Telefone",
                  "Email",
                  "CPF",
                  "Nascimento",
                  "Gênero",
                  "Endereço",
                  "Origem",
                  "Observações",
                ]}
                filename="pacientes"
                action={exportPatients}
              />
            )}
            {canProcedures && (
              <ExportCard
                label="Procedimentos"
                description="O catálogo da clínica com os valores de tabela."
                columns={["Nome", "Preço", "Duração (min)"]}
                filename="procedimentos"
                action={exportProcedures}
              />
            )}
            {canAgenda && (
              <ExportCard
                label="Agendamentos"
                description="Todos os horários marcados, com paciente e situação."
                columns={["Data", "Início", "Fim", "Paciente", "Procedimento", "Status", "Observações"]}
                filename="agendamentos"
                action={exportAppointments}
              />
            )}
            {canFinance && (
              <ExportCard
                label="Financeiro"
                description="Receitas e despesas lançadas, pagas ou não."
                columns={[
                  "Descrição",
                  "Tipo",
                  "Valor",
                  "Vencimento",
                  "Pagamento",
                  "Status",
                  "Forma de pagamento",
                  "Paciente",
                ]}
                filename="financeiro"
                action={exportFinancialEntries}
              />
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            A exportação cobre cadastro, agenda, procedimentos e financeiro. Prontuário, fotos de
            evolução, anamneses e termos assinados não saem por aqui.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
