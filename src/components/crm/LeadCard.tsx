"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { LEAD_ORIGIN_LABELS, type LeadOrigin } from "@/lib/crm/constants";
import { isLeadStale, type ClinicMemberOption, type Lead, type Stage } from "@/lib/crm/types";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LeadDetailDialog } from "@/components/crm/LeadDetailDialog";

export function LeadCard({
  lead,
  stages,
  members,
  staleLeadDays,
  canEdit,
}: {
  lead: Lead;
  stages: Stage[];
  members: ClinicMemberOption[];
  staleLeadDays: number;
  canEdit: boolean;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    disabled: !canEdit,
  });

  const stale = isLeadStale(lead, staleLeadDays);
  const assignee = members.find((m) => m.user_id === lead.assigned_to);

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        className={cn(
          "touch-none gap-1.5 p-3 shadow-sm transition-shadow hover:shadow-md",
          canEdit && "cursor-grab active:cursor-grabbing",
          isDragging && "z-10 opacity-60",
          stale && "border-amber-500",
          lead.status === "lost" && "opacity-50",
        )}
        {...listeners}
        {...attributes}
        onClick={() => setDetailOpen(true)}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium">{lead.name}</p>
          {stale && (
            <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
              parado
            </span>
          )}
        </div>
        <Badge variant="secondary" className="w-fit text-[10px]">
          {LEAD_ORIGIN_LABELS[lead.origin as LeadOrigin]}
        </Badge>
        {lead.potential_value != null && (
          <p className="text-xs text-muted-foreground">{formatCurrency(lead.potential_value)}</p>
        )}
        {lead.next_action && (
          <p className="truncate text-xs text-muted-foreground">Próx: {lead.next_action}</p>
        )}
        {assignee && <p className="text-xs text-muted-foreground">{assignee.full_name}</p>}
      </Card>

      <LeadDetailDialog
        lead={lead}
        stages={stages}
        members={members}
        canEdit={canEdit}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}
