"use client";

import { useTransition } from "react";
import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { moveLeadToStage, reorderStages } from "@/actions/crm";
import { cn } from "@/lib/utils";
import type { ClinicMemberOption, Lead, Stage } from "@/lib/crm/types";
import { StageColumn } from "@/components/crm/StageColumn";
import { NewStageButton } from "@/components/crm/NewStageButton";

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

    startTransition(async () => {
      const result = await moveLeadToStage(leadId, stageId);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
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
    </DndContext>
  );
}
