"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { formatCurrencyInput, parseCurrencyInput } from "@/lib/format/masks";

function maskFromNumber(value: string | number | undefined | null) {
  if (value === "" || value == null) return "";
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric === 0) return "";
  return formatCurrencyInput(numeric.toFixed(2));
}

function sameAmount(a: string, b: string | number | undefined | null) {
  if (b === "" || b == null) return a === "";
  return Number(a || 0) === Number(b);
}

/**
 * Campo de dinheiro que formata enquanto digita ("9.000,00"). O que aparece
 * é a máscara; o que sai é sempre o número puro ("9000.00") — em `name`
 * (input escondido, para formulários) e/ou em `onValueChange` (para telas
 * que guardam o valor em estado).
 */
export function CurrencyInput({
  name,
  value,
  defaultValue = "",
  onValueChange,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "defaultValue" | "value" | "type" | "name"> & {
  name?: string;
  /** Modo controlado: número vindo do estado do pai (ex.: preço preenchido
   *  automaticamente ao escolher um procedimento). */
  value?: string | number;
  /** Modo não controlado: número inicial. */
  defaultValue?: string | number;
  onValueChange?: (value: string) => void;
}) {
  const [masked, setMasked] = useState(() => maskFromNumber(value ?? defaultValue));

  // Reflete mudanças que vêm de fora sem atropelar a digitação: só
  // reformata quando o valor do pai difere do que já está no campo.
  const [lastExternal, setLastExternal] = useState(value);
  if (value !== undefined && value !== lastExternal) {
    setLastExternal(value);
    if (!sameAmount(parseCurrencyInput(masked), value)) {
      setMasked(maskFromNumber(value));
    }
  }

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
