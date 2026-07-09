"use client";

import { useTransition } from "react";
import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { toast } from "sonner";
import { moveLeadToStage } from "@/actions/crm";
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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const leadId = String(active.id);
    const stageId = String(over.id);
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
        {stages.map((stage, index) => (
          <StageColumn
            key={stage.id}
            stage={stage}
            stages={stages}
            leads={leads.filter((lead) => lead.stage_id === stage.id)}
            members={members}
            staleLeadDays={staleLeadDays}
            canEdit={canEdit}
            isFirst={index === 0}
            isLast={index === stages.length - 1}
          />
        ))}
        {canEdit && <NewStageButton />}
      </div>
    </DndContext>
  );
}
