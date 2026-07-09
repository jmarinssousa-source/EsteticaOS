"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createCommissionRule } from "@/actions/commissionRules";
import { COMMISSION_BASIS, COMMISSION_BASIS_LABELS, type CommissionBasis } from "@/lib/financeiro/constants";
import type { ProcedureOption } from "@/lib/procedures/types";
import type { ProfessionalOption } from "@/lib/agenda/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CommissionRuleFormDialog({
  professionals,
  procedures,
}: {
  professionals: ProfessionalOption[];
  procedures: ProcedureOption[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [professionalId, setProfessionalId] = useState("");
  const [procedureId, setProcedureId] = useState("");
  const [basis, setBasis] = useState<CommissionBasis>("sold");
  const [ratePercent, setRatePercent] = useState("");

  function handleSave() {
    startTransition(async () => {
      const result = await createCommissionRule({ professionalId, procedureId, basis, ratePercent: Number(ratePercent) });
      if ("error" in result) {
        setError(result.error ?? "Não foi possível salvar.");
        toast.error(result.error);
      } else {
        setOpen(false);
        setProfessionalId("");
        setProcedureId("");
        setRatePercent("");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="size-4" />
        Nova regra
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova regra de comissão</DialogTitle>
          <DialogDescription>
            Deixe profissional ou procedimento em branco para aplicar a todos. Regras mais específicas têm
            prioridade.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Profissional</Label>
            <Select value={professionalId || "all"} onValueChange={(v) => setProfessionalId(v === "all" ? "" : (v ?? ""))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os profissionais</SelectItem>
                {professionals.map((professional) => (
                  <SelectItem key={professional.user_id} value={professional.user_id}>
                    {professional.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Procedimento</Label>
            <Select value={procedureId || "all"} onValueChange={(v) => setProcedureId(v === "all" ? "" : (v ?? ""))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os procedimentos</SelectItem>
                {procedures.map((procedure) => (
                  <SelectItem key={procedure.id} value={procedure.id}>
                    {procedure.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Base de cálculo</Label>
              <Select value={basis} onValueChange={(v) => v && setBasis(v as CommissionBasis)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMISSION_BASIS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {COMMISSION_BASIS_LABELS[b]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Percentual (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={ratePercent}
                onChange={(e) => setRatePercent(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={isPending || !ratePercent}>
            {isPending ? "Salvando..." : "Salvar regra"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
