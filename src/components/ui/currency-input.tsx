"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { formatCurrencyInput, parseCurrencyInput } from "@/lib/format/masks";

/**
 * Campo de dinheiro que formata enquanto digita ("9.000,00"). O que aparece
 * é a máscara; o que vai no formulário é o número puro ("9000.00"), num
 * input escondido — assim as validações do servidor seguem iguais.
 */
export function CurrencyInput({
  name,
  defaultValue = "",
  onValueChange,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "defaultValue" | "value" | "type" | "name"> & {
  name?: string;
  /** Número inicial (ex.: 9000 ou "9000.00"). */
  defaultValue?: string | number;
  /** Recebe o valor numérico como string a cada digitação. */
  onValueChange?: (value: string) => void;
}) {
  const [masked, setMasked] = useState(() => {
    const initial = String(defaultValue ?? "");
    if (!initial || Number(initial) === 0) return "";
    return formatCurrencyInput(Number(initial).toFixed(2));
  });

  return (
    <>
      <Input
        {...props}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder={props.placeholder ?? "0,00"}
        value={masked}
        onChange={(event) => {
          const next = formatCurrencyInput(event.target.value);
          setMasked(next);
          onValueChange?.(parseCurrencyInput(next));
        }}
      />
      {name && <input type="hidden" name={name} value={parseCurrencyInput(masked)} />}
    </>
  );
}
