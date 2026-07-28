"use client";

import { useState, useTransition } from "react";
import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { moveLeadToStage, reorderStages } from "@/actions/crm";
import { cn } from "@/lib/utils";
import type { ClinicMemberOption, Lead, Stage } from "@/lib/crm/types";
import { StageColumn } from "@/components/crm/StageColumn";
import { NewStageButton } from "@/components/crm/NewStageButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function CrmBoard({
  stages,
  leads,
  members,
  staleLeadDays,
  canEdit,
}: {
  stages: Stage[];
  leads: Lead[];
  members: ClinicMemberOption[];
  staleLeadDays: number;
  canEdit: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [pendingConversion, setPendingConversion] = useState<{
    lead: Lead;
    stage: Stage;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const stageIds = stages.map((s) => s.id);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const isColumnDrag = stageIds.includes(activeId);
    if (isColumnDrag) {
      if (!stageIds.includes(overId)) return;
      const fromIndex = stageIds.indexOf(activeId);
      const toIndex = stageIds.indexOf(overId);
      const reordered = [...stageIds];
      reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, activeId);

      startTransition(async () => {
        const result = await reorderStages(reordered);
        if (result && "error" in result) toast.error(result.error);
      });
      return;
    }

    const leadId = activeId;
    const stageId = overId;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.stage_id === stageId) return;

    // Converter em paciente cria um cadastro de verdade, então confirma
    // antes — um arrastar errado não pode gerar paciente sem querer.
    const target = stages.find((s) => s.id === stageId);
    if (target?.role === "won" && lead.status !== "converted") {
      setPendingConversion({ lead, stage: target });
      return;
    }

    move(leadId, stageId);
  }

  function move(leadId: string, stageId: string) {
    startTransition(async () => {
      const result = await moveLeadToStage(leadId, stageId);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  function confirmConversion() {
    if (!pendingConversion) return;
    const { lead, stage } = pendingConversion;
    setPendingConversion(null);
    startTransition(async () => {
      const result = await moveLeadToStage(lead.id, stage.id);
      if (result && "error" in result) toast.error(result.error);
      else toast.success(`${lead.name} agora é paciente da clínica.`);
    });
  }

  return (
    // id fixo: sem ele o dnd-kit gera um aria-describedby diferente no
    // servidor e no cliente, o que quebra a hidratação da página.
    <DndContext id="crm-board" sensors={sensors} onDragEnd={handleDragEnd}>
      <div className={cn("flex items-start gap-4 overflow-x-auto pb-4", isPending && "opacity-70")}>
        <SortableContext items={stageIds} strategy={horizontalListSortingStrategy}>
          {stages.map((stage) => (
            <StageColumn
              key={stage.id}
              stage={stage}
              stages={stages}
              leads={leads.filter((lead) => lead.stage_id === stage.id)}
              members={members}
              staleLeadDays={staleLeadDays}
              canEdit={canEdit}
            />
          ))}
        </SortableContext>
        {canEdit && <NewStageButton />}
      </div>

      <AlertDialog
        open={pendingConversion !== null}
        onOpenChange={(open) => !open && setPendingConversion(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Converter {pendingConversion?.lead.name} em paciente?
            </AlertDialogTitle>
            <AlertDialogDescription>
              O lead vai para a coluna &quot;{pendingConversion?.stage.name}&quot; e um cadastro de
              paciente será criado com os dados dele, liberando agenda, prontuário e financeiro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmConversion}>Converter</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DndContext>
  );
}
