"use client";

import { useState, useTransition } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { GripVertical, Trash2 } from "lucide-react";
import { deleteStage, renameStage } from "@/actions/crm";
import { cn } from "@/lib/utils";
import type { ClinicMemberOption, Lead, Stage } from "@/lib/crm/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LeadCard } from "@/components/crm/LeadCard";
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

export function StageColumn({
  stage,
  stages,
  leads,
  members,
  staleLeadDays,
  canEdit,
}: {
  stage: Stage;
  stages: Stage[];
  leads: Lead[];
  members: ClinicMemberOption[];
  staleLeadDays: number;
  canEdit: boolean;
}) {
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({ id: stage.id });
  const {
    setNodeRef: setSortableRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id, disabled: !canEdit });
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(stage.name);
  const [, startTransition] = useTransition();

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function handleRename() {
    setEditing(false);
    const trimmed = name.trim();
    if (!trimmed || trimmed === stage.name) {
      setName(stage.name);
      return;
    }
    startTransition(async () => {
      const result = await renameStage(stage.id, trimmed);
      if (result && "error" in result) {
        toast.error(result.error);
        setName(stage.name);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteStage(stage.id);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  return (
    <div
      ref={setSortableRef}
      style={sortableStyle}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-lg border bg-muted/30",
        isDragging && "z-10 opacity-60",
      )}
    >
      <div className="flex items-center gap-1 border-b p-2">
        {canEdit && !editing && (
          <button
            type="button"
            className="touch-none text-muted-foreground hover:text-foreground"
            aria-label="Arrastar para reordenar coluna"
            {...listeners}
            {...attributes}
          >
            <GripVertical className="size-4" />
          </button>
        )}
        {editing ? (
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            className="h-7 flex-1 text-sm"
          />
        ) : (
          <button
            type="button"
            className="flex-1 truncate text-left text-sm font-semibold"
            onClick={() => canEdit && setEditing(true)}
          >
            {stage.name}
          </button>
        )}
        <span className="text-xs text-muted-foreground">{leads.length}</span>
        {canEdit && !editing && (
          <div className="flex items-center">
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="ghost" size="icon" className="size-6" />}>
                <Trash2 className="size-3.5" />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir coluna &quot;{stage.name}&quot;?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {leads.length > 0
                      ? "Mova os leads desta coluna para outra coluna antes de excluí-la."
                      : "Essa ação não pode ser desfeita."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction disabled={leads.length > 0} onClick={handleDelete}>
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
      <div
        ref={setDroppableRef}
        className={cn(
          "flex min-h-24 flex-1 flex-col gap-2 p-2 transition-colors",
          isOver && "bg-accent/60",
        )}
      >
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            stages={stages}
            members={members}
            staleLeadDays={staleLeadDays}
            canEdit={canEdit}
          />
        ))}
        {leads.length === 0 && (
          <p className="p-2 text-center text-xs text-muted-foreground">Nenhum lead</p>
        )}
      </div>
    </div>
  );
}
