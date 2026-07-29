"use client";

import * as React from "react";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";

/** Aceita "9", "930", "9:30", "09h30" e devolve "09:30" (ou "" se não der). */
export function parseTimeInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0 || digits.length > 4) return "";

  const hours = digits.length <= 2 ? Number(digits) : Number(digits.slice(0, digits.length - 2));
  const minutes = digits.length <= 2 ? 0 : Number(digits.slice(-2));
  if (hours > 23 || minutes > 59) return "";

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function buildSlots(step: number): ComboboxOption[] {
  const slots: ComboboxOption[] = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += step) {
    const label = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    slots.push({ value: label, label });
  }
  return slots;
}

/**
 * Campo de horário em lista: clicar em um horário já grava o valor, sem
 * depender do seletor nativo do navegador (que só confirmava a escolha
 * quando o campo perdia o foco). Horários fora da grade continuam
 * possíveis — basta digitar, ex.: "9h37".
 */
export function TimeField({
  name,
  id,
  value,
  defaultValue = "",
  onValueChange,
  disabled,
  step = 15,
}: {
  name?: string;
  id?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  /** Intervalo da grade de horários, em minutos. */
  step?: number;
}) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue);
  const current = value ?? uncontrolled;

  const slots = React.useMemo(() => buildSlots(step), [step]);
  const options = React.useMemo(
    () => (current && !slots.some((slot) => slot.value === current)
      ? [...slots, { value: current, label: current }].sort((a, b) => a.value.localeCompare(b.value))
      : slots),
    [slots, current]
  );

  function commit(next: string) {
    if (value === undefined) setUncontrolled(next);
    onValueChange?.(next);
  }

  return (
    <Combobox
      id={id}
      name={name}
      disabled={disabled}
      options={options}
      value={current}
      onValueChange={commit}
      placeholder="00:00"
      emptyMessage="Digite um horário, ex.: 9h30."
      createLabel={(query) => {
        const parsed = parseTimeInput(query);
        return parsed ? `Usar ${parsed}` : "Horário inválido";
      }}
      onCreate={(query) => {
        const parsed = parseTimeInput(query);
        if (parsed) commit(parsed);
      }}
    />
  );
}
