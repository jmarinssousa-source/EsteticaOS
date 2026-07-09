export type ImportType = "patients" | "procedures" | "appointments" | "financial";

export type ImportRowError = { row: number; reason: string };
export type ImportResult = {
  total: number;
  imported: number;
  errors: ImportRowError[];
};

export type ImportTemplate = {
  type: ImportType;
  label: string;
  description: string;
  headers: string[];
  example: string[];
};

export const IMPORT_TEMPLATES: Record<ImportType, ImportTemplate> = {
  patients: {
    type: "patients",
    label: "Pacientes",
    description: "Cadastro e informações básicas dos pacientes.",
    headers: ["nome", "telefone", "email", "cpf", "data_nascimento", "genero", "endereco", "observacoes"],
    example: [
      "Maria Silva",
      "11999990000",
      "maria@email.com",
      "12345678900",
      "1990-05-20",
      "Feminino",
      "Rua das Flores, 100",
      "",
    ],
  },
  procedures: {
    type: "procedures",
    label: "Procedimentos",
    description: "Catálogo de procedimentos oferecidos pela clínica.",
    headers: ["nome", "preco"],
    example: ["Limpeza de pele", "150.00"],
  },
  appointments: {
    type: "appointments",
    label: "Agenda",
    description:
      "Agendamentos existentes. O paciente precisa já estar cadastrado (importe Pacientes primeiro).",
    headers: [
      "paciente_nome",
      "paciente_cpf",
      "data",
      "hora_inicio",
      "hora_fim",
      "profissional_nome",
      "procedimento_nome",
      "observacoes",
    ],
    example: ["Maria Silva", "12345678900", "2026-08-10", "14:00", "15:00", "", "Limpeza de pele", ""],
  },
  financial: {
    type: "financial",
    label: "Financeiro",
    description: "Lançamentos financeiros (receitas e despesas) já existentes.",
    headers: ["descricao", "tipo", "valor", "vencimento", "paciente_nome", "status"],
    example: ["Venda - pacote botox", "receita", "800.00", "2026-08-01", "Maria Silva", "pago"],
  },
};
