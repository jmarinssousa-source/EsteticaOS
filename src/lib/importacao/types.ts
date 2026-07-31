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
  /**
   * Colunas sem as quais o arquivo é recusado inteiro. Espelham a
   * checagem feita em `actions/importacao.ts`: se mudar lá, mude aqui,
   * senão a tela promete uma coisa e o sistema cobra outra.
   */
  required: string[];
  /** O que a clínica precisa saber antes de preencher. */
  rules: string[];
  /** Quando o sistema considera que a linha já existe e a pula. */
  duplicateRule: string;
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
    required: ["nome"],
    rules: [
      "Datas em dd/mm/aaaa (20/05/1990) ou aaaa-mm-dd.",
      "Telefone e CPF entram com ou sem máscara, e mesmo se o Excel tiver comido o zero da frente.",
    ],
    duplicateRule:
      "Linha pulada quando o CPF já existe, ou quando nome e telefone batem com alguém já cadastrado.",
  },
  procedures: {
    type: "procedures",
    label: "Procedimentos",
    description: "Catálogo de procedimentos oferecidos pela clínica.",
    headers: ["nome", "preco"],
    example: ["Limpeza de pele", "150,00"],
    required: ["nome"],
    rules: ["Valores com vírgula ou ponto: 150,00 e 150.00 dão no mesmo."],
    duplicateRule: "Linha pulada quando já existe um procedimento com o mesmo nome.",
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
    example: ["Maria Silva", "123.456.789-00", "10/08/2026", "14:00", "15:00", "", "Limpeza de pele", ""],
    required: ["paciente_nome", "data", "hora_inicio", "hora_fim"],
    rules: [
      "Datas em dd/mm/aaaa e horários em HH:MM (14:00).",
      "O paciente é encontrado pelo CPF e, na falta dele, pelo nome exato. Importe Pacientes antes.",
      "Profissional e procedimento são ligados pelo nome, se já existirem no sistema.",
    ],
    duplicateRule: "Linha pulada quando já existe agendamento do mesmo paciente na mesma data e hora.",
  },
  financial: {
    type: "financial",
    label: "Financeiro",
    description: "Lançamentos financeiros (receitas e despesas) já existentes.",
    headers: ["descricao", "tipo", "valor", "vencimento", "paciente_nome", "status"],
    example: ["Venda - pacote botox", "receita", "800,00", "01/08/2026", "Maria Silva", "pago"],
    required: ["descricao", "tipo", "valor"],
    rules: [
      'A coluna "tipo" só aceita receita ou despesa.',
      'A coluna "status" aceita pendente, pago, vencido ou cancelado. Em branco, entra como pendente.',
      "Valores com vírgula ou ponto, e vencimento em dd/mm/aaaa.",
    ],
    duplicateRule: "Linha pulada quando já existe lançamento com a mesma descrição, valor e vencimento.",
  },
};
