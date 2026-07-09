"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { deleteCommissionRule } from "@/actions/commissionRules";
import { Button } from "@/components/ui/button";

export function DeleteRuleButton({ ruleId }: { ruleId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCommissionRule(ruleId);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  return (
    <Button variant="ghost" size="icon" className="size-7" disabled={isPending} onClick={handleDelete}>
      <Trash2 className="size-3.5" />
    </Button>
  );
}
