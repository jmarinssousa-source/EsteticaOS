"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateMemberColor } from "@/actions/users";
import {
  PROFESSIONAL_COLORS,
  PROFESSIONAL_COLOR_KEYS,
  getProfessionalColor,
} from "@/lib/agenda/professional-colors";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function ColorLabel({ dot, children }: { dot: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-2.5 shrink-0 rounded-full", dot)} />
      {children}
    </span>
  );
}

/**
 * Cor do membro na agenda. "Automática" (null) mantém a cor derivada do
 * user_id; as demais gravam a chave da paleta em clinic_members.color.
 */
export function MemberColorPicker({
  userId,
  color,
  canEdit,
}: {
  userId: string;
  color: string | null;
  canEdit: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const autoColor = getProfessionalColor(userId);

  if (!canEdit) {
    const resolved = getProfessionalColor(userId, color);
    return resolved ? <span className={cn("inline-block size-3 rounded-full", resolved.dot)} /> : null;
  }

  function handleChange(value: string | null) {
    if (!value) return;
    startTransition(async () => {
      const result = await updateMemberColor(userId, value === "auto" ? null : value);
      if (result?.error) toast.error(result.error);
      else toast.success("Cor atualizada.");
    });
  }

  return (
    <Select
      items={[
        {
          value: "auto",
          label: <ColorLabel dot={autoColor?.dot ?? "bg-muted"}>Automática</ColorLabel>,
        },
        ...PROFESSIONAL_COLOR_KEYS.map((key) => ({
          value: key,
          label: (
            <ColorLabel dot={PROFESSIONAL_COLORS[key].dot}>
              {PROFESSIONAL_COLORS[key].label}
            </ColorLabel>
          ),
        })),
      ]}
      value={color && PROFESSIONAL_COLOR_KEYS.includes(color as never) ? color : "auto"}
      onValueChange={handleChange}
      disabled={isPending}
    >
      <SelectTrigger className="h-8 w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="auto">
          <ColorLabel dot={autoColor?.dot ?? "bg-muted"}>Automática</ColorLabel>
        </SelectItem>
        {PROFESSIONAL_COLOR_KEYS.map((key) => (
          <SelectItem key={key} value={key}>
            <ColorLabel dot={PROFESSIONAL_COLORS[key].dot}>
              {PROFESSIONAL_COLORS[key].label}
            </ColorLabel>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
