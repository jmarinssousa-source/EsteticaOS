export const QUESTION_TYPES = [
  "short_text",
  "long_text",
  "yes_no",
  "yes_no_unsure",
  "single_choice",
  "multiple_choice",
  "date",
  "number",
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  short_text: "Texto curto",
  long_text: "Texto longo",
  yes_no: "Sim/Não",
  yes_no_unsure: "Sim/Não/Não sei",
  single_choice: "Escolha única",
  multiple_choice: "Múltipla escolha",
  date: "Data",
  number: "Número",
};

export const CHOICE_QUESTION_TYPES: QuestionType[] = ["single_choice", "multiple_choice"];

export type ResponseStatus = "pending" | "completed" | "reviewed";

export const RESPONSE_STATUS_LABELS: Record<ResponseStatus, string> = {
  pending: "Pendente",
  completed: "Preenchida",
  reviewed: "Revisada",
};
