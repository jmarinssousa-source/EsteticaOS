"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { formatCnpj, formatPhone } from "@/lib/format/masks";

const MASKS = {
  phone: formatPhone,
  cnpj: formatCnpj,
} as const;

export function MaskedInput({
  mask,
  defaultValue = "",
  ...props
}: Omit<React.ComponentProps<typeof Input>, "defaultValue" | "value"> & {
  mask: keyof typeof MASKS;
  defaultValue?: string;
}) {
  const format = MASKS[mask];
  const [value, setValue] = useState(() => format(defaultValue));

  return (
    <Input
      {...props}
      value={value}
      onChange={(event) => setValue(format(event.target.value))}
    />
  );
}
