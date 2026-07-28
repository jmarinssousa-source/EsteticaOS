"use client";

import Link from "next/link";
import { CalendarPlus, MessageCircle } from "lucide-react";
import type { InactivePatient } from "@/lib/patients/reactivation";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function firstName(name: string) {
  return name.trim().split(/\s+/)[0];
}

function reactivationMessage(patient: InactivePatient, clinicName: string) {
  return (
    `Oi, ${firstName(patient.name)}! Tudo bem? Aqui é da ${clinicName}. ` +
    `Faz um tempinho que a gente não se vê e queria saber como você está. ` +
    `Quer marcar um horário?`
  );
}

export function ReactivationList({
  patients,
  clinicName,
  inactiveDays,
}: {
  patients: InactivePatient[];
  clinicName: string;
  inactiveDays: number;
}) {
  if (patients.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Nenhum paciente parado há mais de {inactiveDays} dias. Sua base está em dia.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Última visita</TableHead>
              <TableHead>Sem voltar há</TableHead>
              <TableHead className="text-right">Contato</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell className="font-medium">
                  <Link href={`/pacientes/${patient.id}`} className="hover:underline">
                    {patient.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {patient.lastVisit
                    ? new Date(`${patient.lastVisit}T00:00:00`).toLocaleDateString("pt-BR")
                    : "Nunca veio"}
                </TableCell>
                <TableCell>{patient.daysSince} dias</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {patient.phone && (
                      <Button
                        size="sm"
                        variant="outline"
                        nativeButton={false}
                        render={
                          <a
                            href={buildWhatsAppUrl(
                              patient.phone,
                              reactivationMessage(patient, clinicName),
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        }
                      >
                        <MessageCircle className="size-4" />
                        WhatsApp
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      nativeButton={false}
                      aria-label={`Agendar retorno de ${patient.name}`}
                      render={<Link href="/agenda" />}
                    >
                      <CalendarPlus className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
