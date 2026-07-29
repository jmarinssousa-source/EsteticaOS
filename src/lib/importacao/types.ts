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
    description:
      "Cadastro e informações básicas dos pacientes. Telefone e CPF podem vir com ou sem máscara.",
    headers: ["nome", "telefone", "email", "cpf", "data_nascimento", "genero", "endereco", "observacoes"],
    example: [
      "Maria Silva",
      "(11) 99999-0000",
      "maria@email.com",
      "123.456.789-00",
      "20/05/1990",
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
    example: ["Limpeza de pele", "150,00"],
  },
  appointments: {
    type: "appointments",
    label: "Agenda",
    description:
      "Agendamentos existentes. O paciente precisa já estar cadastrado (importe Pacientes primeiro). Datas em dd/mm/aaaa e horários em HH:MM.",
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
    example: ["Maria Silva", "123.456.789-00", "10/08/2026", "14:00", "15:00", "", "Limpeza de pele", ""],
  },
  financial: {
    type: "financial",
    label: "Financeiro",
    description:
      "Lançamentos financeiros (receitas e despesas) já existentes. Valores aceitam vírgula ou ponto.",
    headers: ["descricao", "tipo", "valor", "vencimento", "paciente_nome", "status"],
    example: ["Venda - pacote botox", "receita", "800,00", "01/08/2026", "Maria Silva", "pago"],
  },
};
