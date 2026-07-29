"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { formatCnpj, formatCpf, formatPhone } from "@/lib/format/masks";

const MASKS = {
  phone: formatPhone,
  cnpj: formatCnpj,
  cpf: formatCpf,
} as const;

const PLACEHOLDERS: Record<keyof typeof MASKS, string> = {
  phone: "(00) 00000-0000",
  cnpj: "00.000.000/0000-00",
  cpf: "000.000.000-00",
};

export function MaskedInput({
  mask,
  defaultValue = "",
  value,
  onValueChange,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "defaultValue" | "value" | "onChange"> & {
  mask: keyof typeof MASKS;
  defaultValue?: string;
  /** Modo controlado: o pai guarda o texto já mascarado. */
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  const format = MASKS[mask];
  const [uncontrolled, setUncontrolled] = useState(() => format(defaultValue));
  const current = value !== undefined ? format(value) : uncontrolled;

  return (
    <Input
      inputMode="numeric"
      placeholder={PLACEHOLDERS[mask]}
      {...props}
      value={current}
      onChange={(event) => {
        const next = format(event.target.value);
        if (value === undefined) setUncontrolled(next);
        onValueChange?.(next);
      }}
    />
  );
}
