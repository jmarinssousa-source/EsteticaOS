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
import { CurrencyInput } from "@/components/ui/currency-input";
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
  const [customBasisLabel, setCustomBasisLabel] = useState("");
  const [amountKind, setAmountKind] = useState<"percent" | "fixed">("percent");
  const [ratePercent, setRatePercent] = useState("");
  const [fixedAmount, setFixedAmount] = useState("");

  const amountFilled = amountKind === "percent" ? ratePercent !== "" : fixedAmount !== "";

  function handleSave() {
    startTransition(async () => {
      const result = await createCommissionRule({
        professionalId,
        procedureId,
        basis,
        ratePercent: amountKind === "percent" ? ratePercent : "",
        fixedAmount: amountKind === "fixed" ? fixedAmount : "",
        customBasisLabel: basis === "custom" ? customBasisLabel : "",
      });
      if ("error" in result) {
        setError(result.error ?? "Não foi possível salvar.");
        toast.error(result.error);
      } else {
        setOpen(false);
        setProfessionalId("");
        setProcedureId("");
        setRatePercent("");
        setFixedAmount("");
        setCustomBasisLabel("");
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
            <Select
              items={[
                { value: "all", label: "Todos os profissionais" },
                ...professionals.map((professional) => ({
                  value: professional.user_id,
                  label: professional.full_name,
                })),
              ]}
              value={professionalId || "all"}
              onValueChange={(v) => setProfessionalId(v === "all" ? "" : (v ?? ""))}
            >
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
            <Select
              items={[
                { value: "all", label: "Todos os procedimentos" },
                ...procedures.map((procedure) => ({ value: procedure.id, label: procedure.name })),
              ]}
              value={procedureId || "all"}
              onValueChange={(v) => setProcedureId(v === "all" ? "" : (v ?? ""))}
            >
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

          <div className="space-y-2">
            <Label>Base de cálculo</Label>
            <Select
              items={COMMISSION_BASIS.map((b) => ({ value: b, label: COMMISSION_BASIS_LABELS[b] }))}
              value={basis}
              onValueChange={(v) => v && setBasis(v as CommissionBasis)}
            >
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

          {basis === "custom" && (
            <div className="space-y-2">
              <Label>Qual é a combinação?</Label>
              <Input
                placeholder="Ex.: só quando o paciente comparece"
                value={customBasisLabel}
                onChange={(e) => setCustomBasisLabel(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Bases escritas pela clínica ficam registradas aqui como combinado, mas não entram no
                cálculo automático — nesses casos, lance a comissão no próprio orçamento.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Como paga</Label>
            <Select
              items={[
                { value: "percent", label: "Percentual (%)" },
                { value: "fixed", label: "Valor fixo por atendimento (R$)" },
              ]}
              value={amountKind}
              onValueChange={(v) => v && setAmountKind(v as "percent" | "fixed")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Percentual (%)</SelectItem>
                <SelectItem value="fixed">Valor fixo por atendimento (R$)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {amountKind === "percent" ? (
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
          ) : (
            <div className="space-y-2">
              <Label>Valor por atendimento (R$)</Label>
              <CurrencyInput value={fixedAmount} onValueChange={setFixedAmount} />
              <p className="text-xs text-muted-foreground">
                Ex.: R$ 20,00 por paciente atendido, independente do valor do procedimento.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={isPending || !amountFilled}>
            {isPending ? "Salvando..." : "Salvar regra"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
