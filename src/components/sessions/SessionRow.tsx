"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { SESSION_STATUS_LABELS } from "@/lib/sessions/constants";
import type { Session, PackageBalanceOption } from "@/lib/sessions/types";
import type { PatientOption, ProcedureOption, ProfessionalOption } from "@/lib/agenda/types";
import { SessionDetailDialog } from "@/components/sessions/SessionDetailDialog";

export function SessionRow({
  session,
  patients,
  professionals,
  procedures,
  packageBalances,
  canEdit,
  showPatient = true,
}: {
  session: Session;
  patients: PatientOption[];
  professionals: ProfessionalOption[];
  procedures: ProcedureOption[];
  packageBalances: (PackageBalanceOption & { patient_id: string })[];
  canEdit: boolean;
  showPatient?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const patient = patients.find((p) => p.id === session.patient_id);
  const professional = professionals.find((p) => p.user_id === session.professional_id);
  const procedure = procedures.find((p) => p.id === session.procedure_id);

  return (
    <>
      <TableRow className="cursor-pointer" onClick={() => setOpen(true)}>
        {showPatient && <TableCell className="font-medium">{patient?.name ?? "—"}</TableCell>}
        <TableCell>{new Date(session.session_date).toLocaleDateString("pt-BR")}</TableCell>
        <TableCell>{procedure?.name ?? "—"}</TableCell>
        <TableCell>{professional?.full_name ?? "—"}</TableCell>
        <TableCell>
          <Badge variant="secondary">{SESSION_STATUS_LABELS[session.status]}</Badge>
        </TableCell>
        <TableCell>
          {session.patient_signature && session.professional_signature
            ? "Assinada"
            : session.patient_signature || session.professional_signature
              ? "Parcial"
              : "—"}
        </TableCell>
      </TableRow>

      <SessionDetailDialog
        session={session}
        patients={patients}
        professionals={professionals}
        procedures={procedures}
        packageBalances={packageBalances}
        canEdit={canEdit}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
