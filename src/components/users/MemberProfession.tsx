"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateMemberProfession } from "@/actions/users";
import { Input } from "@/components/ui/input";

/**
 * Profissão do membro — texto livre, porque a lista real (biomédica,
 * fisioterapeuta, esteticista, nutricionista...) é maior do que qualquer
 * enum caberia. Salva ao sair do campo.
 */
export function MemberProfession({
  userId,
  profession,
  canEdit,
}: {
  userId: string;
  profession: string | null;
  canEdit: boolean;
}) {
  const [value, setValue] = useState(profession ?? "");
  const [isPending, startTransition] = useTransition();

  if (!canEdit) {
    return <span className="text-sm text-muted-foreground">{profession || "—"}</span>;
  }

  function handleBlur() {
    if (value.trim() === (profession ?? "").trim()) return;
    startTransition(async () => {
      const result = await updateMemberProfession(userId, value);
      if (result?.error) toast.error(result.error);
      else toast.success("Profissão atualizada.");
    });
  }

  return (
    <Input
      className="h-8 w-40"
      placeholder="Ex.: biomédica"
      value={value}
      disabled={isPending}
      onChange={(event) => setValue(event.target.value)}
      onBlur={handleBlur}
    />
  );
}
