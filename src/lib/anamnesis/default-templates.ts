import type { QuestionType } from "@/lib/anamnesis/constants";

export type DefaultQuestion = {
  label: string;
  type: QuestionType;
  required: boolean;
  options: string[];
};

export type DefaultTemplate = {
  name: string;
  questions: DefaultQuestion[];
};

// Modelos prontos para novas clínicas — ponto de partida editável, não um
// formulário fechado. A clínica pode adicionar, remover ou renomear
// perguntas livremente em Configurações > Modelos de anamnese.
export const DEFAULT_ANAMNESIS_TEMPLATES: DefaultTemplate[] = [
  {
    name: "Anamnese Facial",
    questions: [
      {
        label: "Qual é o seu tipo de pele?",
        type: "single_choice",
        required: true,
        options: ["Oleosa", "Seca", "Mista", "Normal", "Sensível"],
      },
      {
        label: "Possui alguma alergia conhecida (cosméticos, medicamentos, látex, etc.)?",
        type: "yes_no_unsure",
        required: true,
        options: [],
      },
      { label: "Se sim, quais alergias?", type: "long_text", required: false, options: [] },
      { label: "Está grávida ou amamentando?", type: "yes_no_unsure", required: true, options: [] },
      { label: "Usa alguma medicação contínua? Qual?", type: "long_text", required: true, options: [] },
      {
        label: "Já realizou procedimentos estéticos faciais anteriormente?",
        type: "yes_no",
        required: true,
        options: [],
      },
      { label: "Se sim, quais procedimentos e quando?", type: "long_text", required: false, options: [] },
      {
        label: "Tem histórico de queloide ou cicatrização anormal?",
        type: "yes_no",
        required: true,
        options: [],
      },
      {
        label: "Como você descreveria sua exposição solar no dia a dia?",
        type: "single_choice",
        required: true,
        options: ["Baixa", "Moderada", "Alta"],
      },
      {
        label: "Qual sua expectativa em relação ao procedimento?",
        type: "long_text",
        required: false,
        options: [],
      },
    ],
  },
  {
    name: "Anamnese Corporal",
    questions: [
      {
        label: "Possui alguma condição de saúde crônica (diabetes, hipertensão, tireoide, etc.)?",
        type: "yes_no_unsure",
        required: true,
        options: [],
      },
      { label: "Se sim, quais condições?", type: "long_text", required: false, options: [] },
      { label: "Está grávida ou amamentando?", type: "yes_no_unsure", required: true, options: [] },
      {
        label: "Já realizou cirurgias na região que será tratada?",
        type: "yes_no",
        required: true,
        options: [],
      },
      { label: "Se sim, detalhe as cirurgias e datas aproximadas.", type: "long_text", required: false, options: [] },
      {
        label: "Tem histórico de queloide ou cicatrização anormal?",
        type: "yes_no",
        required: true,
        options: [],
      },
      {
        label: "Com que frequência pratica atividade física?",
        type: "single_choice",
        required: false,
        options: ["Não pratica", "1 a 2x por semana", "3 a 4x por semana", "5x ou mais por semana"],
      },
      {
        label: "Possui marca-passo, prótese metálica ou implante na região?",
        type: "yes_no",
        required: true,
        options: [],
      },
      { label: "Possui alguma alergia conhecida?", type: "long_text", required: false, options: [] },
      {
        label: "Qual sua expectativa em relação ao procedimento?",
        type: "long_text",
        required: false,
        options: [],
      },
    ],
  },
];
