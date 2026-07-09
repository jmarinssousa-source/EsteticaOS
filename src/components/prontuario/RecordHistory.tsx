import { MAP_TYPE_LABELS } from "@/lib/prontuario/constants";
import type { PatientRecord } from "@/lib/prontuario/types";
import type { ProcedureOption } from "@/lib/procedures/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RecordHistory({
  records,
  procedures,
  signedMapUrls,
}: {
  records: PatientRecord[];
  procedures: ProcedureOption[];
  signedMapUrls: Record<string, string>;
}) {
  if (records.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma evolução registrada ainda.</p>;
  }

  return (
    <div className="space-y-3">
      {records.map((record) => {
        const procedure = procedures.find((p) => p.id === record.procedure_id);
        const mapUrl = record.map_image_path ? signedMapUrls[record.map_image_path] : null;

        return (
          <Card key={record.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">
                {new Date(record.record_date).toLocaleDateString("pt-BR")}
                {procedure && ` · ${procedure.name}`}
              </CardTitle>
              {record.map_type && <Badge variant="secondary">{MAP_TYPE_LABELS[record.map_type]}</Badge>}
            </CardHeader>
            <CardContent className="space-y-2">
              {record.notes && <p className="text-sm">{record.notes}</p>}
              {record.complication && (
                <p className="text-sm text-amber-700">Intercorrência: {record.complication}</p>
              )}
              {mapUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mapUrl}
                  alt={`Mapa ${record.map_type ?? ""}`}
                  className="h-48 rounded-md border bg-white object-contain"
                />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
