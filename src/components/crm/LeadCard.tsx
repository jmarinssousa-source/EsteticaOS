"use client";

import { useState, useTransition } from "react";
import { useDraggable } from "@dnd-kit/core";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { deleteLead } from "@/actions/crm";
import { cn } from "@/lib/utils";
import { LEAD_ORIGIN_LABELS, type LeadOrigin } from "@/lib/crm/constants";
import { isLeadStale, type ClinicMemberOption, type Lead, type Stage } from "@/lib/crm/types";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LeadDetailDialog } from "@/components/crm/LeadDetailDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const [isPending, startTransition] = useTransition();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    disabled: !canEdit,
  });

  const stale = isLeadStale(lead, staleLeadDays);
  const assignee = members.find((m) => m.user_id === lead.assigned_to);

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteLead(lead.id);
      if (result && "error" in result) toast.error(result.error);
    });
  }

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
          <div className="flex shrink-0 items-center gap-1">
            {stale && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                parado
              </span>
            )}
            {canEdit && (
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-5 text-muted-foreground hover:text-destructive"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    />
                  }
                >
                  <Trash2 className="size-3" />
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir lead &quot;{lead.name}&quot;?</AlertDialogTitle>
                    <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction disabled={isPending} onClick={handleDelete}>
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
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
