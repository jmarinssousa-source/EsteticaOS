import { requirePermission } from "@/lib/auth/session";
import { currentYearMonth } from "@/lib/format";
import { ReportNav } from "@/components/relatorios/ReportNav";
import { DashboardSection } from "@/components/relatorios/DashboardSection";
import { ReportsSection, type ReportKey } from "@/components/relatorios/ReportsSection";

export const metadata = { title: "Relatórios — EstéticaOS" };

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    report?: string;
    from?: string;
    to?: string;
    status?: string;
    origem?: string;
    profissional?: string;
    paciente?: string;
  }>;
}) {
  const member = await requirePermission("reports_view");
  const params = await searchParams;

  const tab = params.tab === "relatorios" ? "relatorios" : "dashboard";
  const from = params.from || `${currentYearMonth()}-01`;
  const to = params.to || new Date().toISOString().slice(0, 10);
  const report = (params.report || "leads") as ReportKey;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>

      <ReportNav tab={tab} from={from} to={to} />

      {tab === "dashboard" && <DashboardSection member={member} from={from} to={to} />}

      {tab === "relatorios" && (
        <ReportsSection
          member={member}
          report={report}
          from={from}
          to={to}
          status={params.status ?? ""}
          origem={params.origem ?? ""}
          profissional={params.profissional ?? ""}
          paciente={params.paciente ?? ""}
        />
      )}
    </div>
  );
}
