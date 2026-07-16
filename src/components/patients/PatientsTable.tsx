"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Patient = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  cpf: string | null;
};

const PAGE_SIZE_OPTIONS = [10, 20] as const;

export function PatientsTable({ patients }: { patients: Patient[] }) {
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return patients;
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.phone?.toLowerCase().includes(term) ||
        p.cpf?.toLowerCase().includes(term),
    );
  }, [patients, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente..."
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            className="pl-8"
          />
        </div>
        <div className="ml-auto flex items-center gap-1 text-sm text-muted-foreground">
          <span>Por página:</span>
          {PAGE_SIZE_OPTIONS.map((size) => (
            <Button
              key={size}
              type="button"
              size="sm"
              variant={pageSize === size ? "default" : "outline"}
              onClick={() => handlePageSizeChange(size)}
            >
              {size}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>CPF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((patient) => (
                <TableRow key={patient.id} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <Link href={`/pacientes/${patient.id}`} className="block">
                      {patient.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/pacientes/${patient.id}`} className="block">
                      {patient.phone ?? "—"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/pacientes/${patient.id}`} className="block">
                      {patient.email ?? "—"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/pacientes/${patient.id}`} className="block">
                      {patient.cpf ?? "—"}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    Nenhum paciente encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            Página {safePage} de {totalPages} ({filtered.length} paciente{filtered.length === 1 ? "" : "s"})
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
            >
              Anterior
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={safePage >= totalPages}
              onClick={() => setPage(safePage + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
