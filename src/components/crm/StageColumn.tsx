"use client";

import { useState, useTransition } from "react";
import { useDroppable } from "@dnd-kit/core";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { deleteStage, reorderStage, renameStage } from "@/actions/crm";
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
  isFirst,
  isLast,
}: {
  stage: Stage;
  stages: Stage[];
  leads: Lead[];
  members: ClinicMemberOption[];
  staleLeadDays: number;
  canEdit: boolean;
  isFirst: boolean;
  isLast: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(stage.name);
  const [isPending, startTransition] = useTransition();

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

  function handleReorder(direction: "left" | "right") {
    startTransition(async () => {
      const result = await reorderStage(stage.id, direction);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg border bg-muted/30">
      <div className="flex items-center gap-1 border-b p-2">
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
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              disabled={isFirst || isPending}
              onClick={() => handleReorder("left")}
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              disabled={isLast || isPending}
              onClick={() => handleReorder("right")}
            >
              <ChevronRight className="size-3.5" />
            </Button>
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
        ref={setNodeRef}
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
