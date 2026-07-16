import { BrowserFrame } from "@/components/marketing/BrowserFrame";

const COLUMNS = [
  { name: "Novo lead", leads: ["Sabrina Lopes", "Natália Reis"] },
  { name: "Avaliação marcada", leads: ["Aline Vidal"] },
  { name: "Fechado", leads: ["Kelly Rocha"] },
];

export function CrmPreview() {
  return (
    <BrowserFrame path="/crm">
      <div className="grid grid-cols-3 gap-2">
        {COLUMNS.map((col) => (
          <div key={col.name} className="rounded-xl bg-muted/50 p-2">
            <p className="mb-2 truncate text-[10px] font-medium text-muted-foreground">{col.name}</p>
            <div className="space-y-1.5">
              {col.leads.map((lead) => (
                <div
                  key={lead}
                  className="truncate rounded-lg border border-border bg-background px-2 py-1.5 text-[11px] font-medium"
                >
                  {lead}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}
