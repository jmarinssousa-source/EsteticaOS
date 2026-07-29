"use client";

import * as React from "react";
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { CheckIcon, ChevronDownIcon, PlusIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type ComboboxOption = { value: string; label: string };

type CreatableOption = ComboboxOption & { create?: string };

/** Sem acento e sem caixa: digitar "andre" acha "André Luiz". */
function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase();
}

/**
 * Campo de seleção com busca: o usuário digita e a lista vai filtrando,
 * em vez de rolar até achar. Substitui o `Select` em listas que crescem
 * com o uso da clínica (pacientes, procedimentos, pacotes).
 *
 * Quando `onCreate` é passado, digitar um nome que ainda não existe
 * oferece a opção de cadastrá-lo ali mesmo.
 */
export function Combobox({
  options,
  value,
  defaultValue = "",
  onValueChange,
  name,
  id,
  placeholder = "Selecione",
  emptyMessage = "Nenhum resultado.",
  disabled,
  className,
  clearable = true,
  onCreate,
  canCreate,
  createLabel = (query: string) => `Cadastrar “${query}”`,
}: {
  options: ComboboxOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  id?: string;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  clearable?: boolean;
  onCreate?: (label: string) => void;
  /** Recusa a opção de cadastrar para textos que não fazem sentido. */
  canCreate?: (query: string) => boolean;
  createLabel?: (query: string) => string;
}) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue);
  const selectedValue = value ?? uncontrolled;
  const selected = options.find((option) => option.value === selectedValue) ?? null;

  const [query, setQuery] = React.useState("");

  const trimmed = query.trim();
  const exists =
    trimmed !== "" &&
    options.some((option) => option.label.trim().toLocaleLowerCase() === trimmed.toLocaleLowerCase());

  const showCreate =
    Boolean(onCreate) && trimmed !== "" && !exists && (canCreate?.(trimmed) ?? true);

  const items: CreatableOption[] = showCreate
    ? [...options, { value: `__create__:${trimmed}`, label: createLabel(trimmed), create: trimmed }]
    : options;

  function commit(next: string) {
    if (value === undefined) setUncontrolled(next);
    onValueChange?.(next);
  }

  return (
    <ComboboxPrimitive.Root<CreatableOption>
      items={items}
      value={selected}
      disabled={disabled}
      // Filtro próprio por dois motivos: ignorar acentos e nunca esconder
      // a opção de cadastrar, cujo rótulo não contém o texto digitado.
      filter={(item, query) =>
        Boolean(item.create) || normalize(item.label).includes(normalize(query))
      }
      onValueChange={(next) => {
        if (next?.create) {
          onCreate?.(next.create);
          setQuery("");
          return;
        }
        commit(next?.value ?? "");
      }}
      onInputValueChange={setQuery}
    >
      <ComboboxPrimitive.InputGroup
        className={cn(
          "relative flex h-8 w-full items-center rounded-lg border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-disabled:pointer-events-none has-disabled:opacity-50 dark:bg-input/30",
          className
        )}
      >
        <ComboboxPrimitive.Input
          id={id}
          placeholder={placeholder}
          className="h-full w-full min-w-0 rounded-lg bg-transparent py-1 pr-14 pl-2.5 text-base outline-none placeholder:text-muted-foreground md:text-sm"
        />
        <div className="absolute right-1 flex h-full items-center text-muted-foreground">
          {clearable && (
            <ComboboxPrimitive.Clear
              aria-label="Limpar seleção"
              className="flex size-6 items-center justify-center rounded-md hover:text-foreground"
              onClick={() => commit("")}
            >
              <XIcon className="size-3.5" />
            </ComboboxPrimitive.Clear>
          )}
          <ComboboxPrimitive.Trigger
            aria-label="Abrir lista"
            className="flex size-6 items-center justify-center rounded-md hover:text-foreground"
          >
            <ChevronDownIcon className="size-4" />
          </ComboboxPrimitive.Trigger>
        </div>
      </ComboboxPrimitive.InputGroup>

      {name && <input type="hidden" name={name} value={selectedValue} />}

      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner className="isolate z-50 outline-none" sideOffset={4}>
          <ComboboxPrimitive.Popup className="max-h-[min(24rem,var(--available-height))] w-(--anchor-width) max-w-(--available-width) origin-(--transform-origin) overflow-y-auto overscroll-contain rounded-lg bg-popover py-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            {/* O elemento raiz do Empty fica sempre montado (é o que
                anuncia a mudança para leitores de tela), então o espaçamento
                vai no filho — senão sobra um vão no topo da lista cheia. */}
            <ComboboxPrimitive.Empty>
              <p className="px-2.5 py-2 text-sm text-muted-foreground">{emptyMessage}</p>
            </ComboboxPrimitive.Empty>
            <ComboboxPrimitive.List>
              {(item: CreatableOption) => (
                <ComboboxPrimitive.Item
                  key={item.value}
                  value={item}
                  className="grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 px-2 py-1.5 text-sm outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                >
                  {item.create ? (
                    <PlusIcon className="col-start-1 size-4" />
                  ) : (
                    <ComboboxPrimitive.ItemIndicator className="col-start-1">
                      <CheckIcon className="size-4" />
                    </ComboboxPrimitive.ItemIndicator>
                  )}
                  <span className="col-start-2 truncate">{item.label}</span>
                </ComboboxPrimitive.Item>
              )}
            </ComboboxPrimitive.List>
          </ComboboxPrimitive.Popup>
        </ComboboxPrimitive.Positioner>
      </ComboboxPrimitive.Portal>
    </ComboboxPrimitive.Root>
  );
}
