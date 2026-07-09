// Base de perguntas frequentes do assistente interno (PRD 10.17).
//
// Escopo do MVP: ajuda de uso do sistema para a equipe da clínica, não
// atendimento ao paciente e não execução de ações — é uma base de
// conteúdo estática e consultiva, sem chamadas a IA/LLM. Respostas com
// IA de verdade (sugestão de próxima ação, reativação, etc.) são
// escopo da Versão 4 do produto (Evoluções Futuras), não do MVP.

export type FaqEntry = {
  id: string;
  category: string;
  question: string;
  steps: string[];
  keywords?: string[];
};

export const FAQ_CATEGORIES = [
  "Primeiros passos",
  "CRM",
  "Pacientes e anamnese",
  "Agenda",
  "Orçamentos e vendas",
  "Sessões e assinaturas",
  "Prontuário",
  "Financeiro",
  "Estoque",
  "Relatórios",
  "Configurações e permissões",
] as const;

export const FAQ_ENTRIES: FaqEntry[] = [
  {
    id: "hoje-tela",
    category: "Primeiros passos",
    question: "Para que serve a tela Hoje?",
    steps: [
      "É a tela inicial ao entrar no sistema — mostra um resumo do que precisa da sua atenção agora.",
      "Cada card (agenda do dia, leads parados, orçamentos em aberto, contas a vencer, etc.) é clicável e leva direto para a área correspondente já com os dados relevantes.",
      "O painel de Alertas, na parte de baixo, reúne tudo que está pendente em um só lugar: leads parados, sessões sem assinatura, contas vencidas e estoque baixo ou vencendo.",
    ],
    keywords: ["hoje", "início", "dashboard", "resumo"],
  },
  {
    id: "meta-mes",
    category: "Primeiros passos",
    question: "Como defino a meta de vendas do mês?",
    steps: [
      "Vá em Hoje (ou Relatórios > Dashboard).",
      'No card "Meta do mês", clique em "Editar meta".',
      "Informe o valor da meta e salve. Apenas o Dono/Admin e o Gerente podem alterar a meta.",
      "O valor vendido e o quanto falta são calculados automaticamente conforme as vendas do mês.",
    ],
    keywords: ["meta", "objetivo", "vendas do mês"],
  },
  {
    id: "criar-lead",
    category: "CRM",
    question: "Como cadastro um novo lead?",
    steps: [
      "Abra o menu CRM.",
      'Clique em "Novo lead".',
      "Preencha nome, telefone, origem e, se souber, o valor potencial e a próxima ação.",
      "O lead aparece automaticamente na primeira coluna do funil (normalmente \"Novo lead\").",
    ],
    keywords: ["lead", "crm", "cadastrar lead", "novo contato"],
  },
  {
    id: "mover-lead",
    category: "CRM",
    question: "Como movo um lead entre as etapas do funil?",
    steps: [
      "No CRM, arraste o card do lead e solte na coluna desejada (funciona com o dedo, no celular/tablet, ou com o mouse).",
      "Se preferir não arrastar, clique no lead para abrir os detalhes e use o campo \"Coluna\" para escolher a nova etapa.",
    ],
    keywords: ["mover lead", "funil", "arrastar", "kanban"],
  },
  {
    id: "leads-parados",
    category: "CRM",
    question: "Como vejo quais leads estão parados?",
    steps: [
      "No CRM, os leads sem movimentação há vários dias aparecem com um selo laranja \"parado\" no card.",
      "Você define a partir de quantos dias um lead é considerado parado em Configurações > Minha clínica.",
      "A Tela Hoje também mostra a quantidade de leads parados em um card — clique nele para ir direto ao CRM.",
    ],
    keywords: ["lead parado", "follow-up", "esquecido"],
  },
  {
    id: "converter-lead-paciente",
    category: "CRM",
    question: "Como converto um lead em paciente?",
    steps: [
      "No CRM, clique no card do lead para abrir os detalhes.",
      'Clique em "Converter em paciente".',
      "O sistema cria o cadastro do paciente automaticamente com os dados do lead. Você já pode agendar, criar orçamento, etc.",
    ],
    keywords: ["converter lead", "virar paciente"],
  },
  {
    id: "criar-paciente",
    category: "Pacientes e anamnese",
    question: "Como cadastro um paciente?",
    steps: [
      "Abra o menu Pacientes.",
      'Clique em "Novo paciente".',
      "Preencha nome (obrigatório), telefone, e-mail, CPF, data de nascimento e demais dados.",
      "Salve — você será levado direto para a tela completa do paciente, com todas as abas (Resumo, Anamnese, Agenda, Orçamentos, Sessões, Financeiro, Prontuário, Fotos, Assinaturas).",
      "Se o paciente já veio de um lead do CRM, use \"Converter em paciente\" em vez de cadastrar de novo.",
    ],
    keywords: ["paciente", "cadastrar paciente", "novo paciente"],
  },
  {
    id: "criar-anamnese",
    category: "Pacientes e anamnese",
    question: "Como crio um modelo de anamnese?",
    steps: [
      "Vá em Configurações > Modelos de anamnese.",
      'Clique em "Novo modelo" e dê um nome (ex: "Anamnese padrão").',
      "Abra o modelo criado e clique em \"Nova pergunta\" para cada pergunta que quiser incluir.",
      "Escolha o tipo de resposta (texto curto, texto longo, sim/não, escolha única, múltipla escolha, data ou número) e marque como obrigatória se necessário.",
      "Use as setas para reordenar as perguntas na ordem que o paciente vai responder.",
    ],
    keywords: ["anamnese", "modelo", "formulário", "perguntas"],
  },
  {
    id: "enviar-anamnese",
    category: "Pacientes e anamnese",
    question: "Como envio a anamnese para o paciente preencher?",
    steps: [
      "Abra o paciente e vá na aba Anamnese.",
      'Clique em "Enviar anamnese" e escolha o modelo.',
      'Um link é gerado. Você pode clicar em "Preencher agora neste dispositivo" e entregar o tablet/celular para o paciente preencher na hora, ou copiar o link e enviar por WhatsApp para o paciente preencher no celular dele.',
      "O paciente não precisa criar conta — assim que ele enviar, a resposta aparece automaticamente na aba Anamnese do paciente.",
    ],
    keywords: ["enviar anamnese", "link anamnese", "paciente preencher"],
  },
  {
    id: "buscar-paciente",
    category: "Pacientes e anamnese",
    question: "Como encontro um paciente rapidamente?",
    steps: [
      "No menu Pacientes, use o campo de busca no topo da lista.",
      "Você pode buscar por nome, telefone ou CPF.",
    ],
    keywords: ["buscar paciente", "procurar paciente"],
  },
  {
    id: "criar-agendamento",
    category: "Agenda",
    question: "Como agendo um atendimento?",
    steps: [
      "Abra o menu Agenda.",
      'Clique em "Novo agendamento".',
      "Escolha o paciente, o profissional, o procedimento (opcional) e defina data e horário.",
      "Salve. Você pode alternar entre as visões Dia, Semana e Mês para organizar melhor.",
    ],
    keywords: ["agendar", "agendamento", "marcar horário"],
  },
  {
    id: "status-agendamento",
    category: "Agenda",
    question: "Como marco falta ou confirmo um agendamento?",
    steps: [
      "Na Agenda, clique no card do agendamento.",
      'Altere o campo "Status" para Confirmado, Compareceu, Falta, Cancelado ou Realizado, conforme o caso.',
      "Para reagendar, edite a data e o horário no mesmo formulário.",
    ],
    keywords: ["falta", "confirmar", "status agendamento", "reagendar"],
  },
  {
    id: "criar-orcamento",
    category: "Orçamentos e vendas",
    question: "Como crio um orçamento?",
    steps: [
      "Abra o menu Orçamentos e clique em \"Novo orçamento\".",
      "Escolha o paciente e salve — você será levado para a tela do orçamento.",
      'Clique em "Adicionar item" para incluir procedimentos avulsos ou pacotes, com quantidade, valor e desconto.',
      "O valor total é calculado automaticamente conforme você adiciona itens.",
    ],
    keywords: ["orçamento", "criar orçamento", "proposta"],
  },
  {
    id: "aprovar-orcamento-venda",
    category: "Orçamentos e vendas",
    question: "Como aprovo um orçamento e transformo em venda?",
    steps: [
      "Abra o orçamento (menu Orçamentos, ou pela aba Orçamentos do paciente).",
      'Marque como "Enviado" e depois "Aprovar" (ou aprove direto, se preferir).',
      'Com o orçamento aprovado, clique em "Converter em venda".',
      "O sistema cria a venda, gera o lançamento financeiro automaticamente e, se algum item for um pacote, já cria o saldo de sessões do paciente.",
    ],
    keywords: ["aprovar orçamento", "converter venda", "fechar venda"],
  },
  {
    id: "criar-pacote",
    category: "Orçamentos e vendas",
    question: "Como crio um pacote de sessões?",
    steps: [
      "Vá em Configurações > Pacotes.",
      'Clique em "Novo pacote".',
      "Dê um nome, defina a quantidade de sessões, o valor, a validade (opcional) e marque quais procedimentos fazem parte do pacote.",
      "Depois disso, o pacote aparece como opção ao adicionar um item em qualquer orçamento.",
    ],
    keywords: ["pacote", "sessões pacote", "criar pacote"],
  },
  {
    id: "lancar-sessao",
    category: "Sessões e assinaturas",
    question: "Como lanço uma sessão?",
    steps: [
      "Abra o menu Sessões, ou a aba Sessões dentro do paciente, e clique em \"Nova sessão\".",
      "Escolha o paciente (se não estiver na aba do paciente), o procedimento e o profissional.",
      "Se a sessão for de um pacote comprado pelo paciente, selecione o pacote — o saldo restante aparece na hora. Se preferir, deixe como \"Sessão avulsa\".",
      "Mesmo sem saldo no pacote, o sistema permite lançar a sessão — só mostra um aviso.",
    ],
    keywords: ["sessão", "lançar sessão", "atendimento"],
  },
  {
    id: "assinar-sessao",
    category: "Sessões e assinaturas",
    question: "Como coleto a assinatura do paciente e do profissional?",
    steps: [
      "Abra a sessão (menu Sessões ou aba Sessões do paciente) e marque o status como \"Realizada\".",
      "Na mesma tela, há um quadro de assinatura para o paciente e outro para o profissional.",
      "Peça para cada um assinar com o dedo, caneta ou mouse, direto na tela do tablet, celular ou computador, e confirme.",
    ],
    keywords: ["assinatura", "assinar sessão", "assinatura digital"],
  },
  {
    id: "termo-consentimento",
    category: "Sessões e assinaturas",
    question: "Como coleto o termo de consentimento e autorização de imagem?",
    steps: [
      "Abra o paciente e vá na aba Assinaturas.",
      "Peça para o paciente ler o termo e assinar na tela.",
      'Depois de assinado, use "Visualizar / baixar" para ver ou imprimir o termo (você pode salvar como PDF direto da tela de impressão do navegador).',
    ],
    keywords: ["termo", "consentimento", "autorização de imagem"],
  },
  {
    id: "prontuario-evolucao",
    category: "Prontuário",
    question: "Como registro uma evolução no prontuário?",
    steps: [
      "Abra o paciente e vá na aba Prontuário.",
      'Clique em "Nova evolução".',
      "Escreva as observações e, se quiser, escolha um mapa (facial ou corporal) para desenhar marcações direto na tela.",
      "Você também pode registrar uma intercorrência, se houver.",
    ],
    keywords: ["prontuário", "evolução", "mapa facial", "mapa corporal"],
  },
  {
    id: "fotos-before-after",
    category: "Prontuário",
    question: "Como envio fotos de antes/depois?",
    steps: [
      "Abra o paciente e vá na aba Fotos.",
      'Clique em "Enviar fotos", escolha a(s) imagem(ns) do celular ou computador e marque o tipo: Antes, Depois ou Geral.',
    ],
    keywords: ["fotos", "antes e depois", "before after"],
  },
  {
    id: "lancar-financeiro",
    category: "Financeiro",
    question: "Como lanço uma receita ou despesa manual?",
    steps: [
      "Abra o menu Financeiro e clique em \"Novo lançamento\".",
      "Escolha o tipo (Receita ou Despesa), descreva, informe o valor e o vencimento.",
      "Vendas feitas a partir de um orçamento aprovado já geram o lançamento de receita automaticamente — use o lançamento manual para os demais casos (aluguel, compra de insumo avulsa, etc.).",
    ],
    keywords: ["financeiro", "receita", "despesa", "lançamento"],
  },
  {
    id: "marcar-pago-recibo",
    category: "Financeiro",
    question: "Como marco um pagamento e gero o recibo?",
    steps: [
      "No Financeiro, clique no lançamento.",
      'Clique em "Marcar como pago" (ou ajuste o status, a data e a forma de pagamento manualmente) e salve.',
      'Com o lançamento pago, o botão "Gerar recibo" aparece — ele abre uma página de impressão que você pode imprimir ou salvar como PDF pelo navegador.',
    ],
    keywords: ["recibo", "marcar pago", "pagamento"],
  },
  {
    id: "nota-fiscal",
    category: "Financeiro",
    question: "Como controlo a nota fiscal de um lançamento?",
    steps: [
      "Abra o lançamento no Financeiro.",
      'Ative "Nota fiscal emitida" e informe o número da NF, se já tiver emitido fora do sistema.',
      "O EstéticaOS não emite nota fiscal automaticamente — esse controle é só um registro manual.",
    ],
    keywords: ["nota fiscal", "nf"],
  },
  {
    id: "configurar-comissao",
    category: "Financeiro",
    question: "Como configuro comissão dos profissionais?",
    steps: [
      "Vá em Configurações > Comissões.",
      'Clique em "Nova regra".',
      "Escolha o profissional e/ou procedimento (deixe em branco para aplicar a todos), a base de cálculo (sobre valor vendido ou sobre valor recebido) e o percentual.",
      "O relatório de comissões (Financeiro ou Relatórios) passa a calcular automaticamente com base nessa regra. Sem nenhuma regra, o sistema usa o valor de comissão lançado manualmente em cada orçamento.",
    ],
    keywords: ["comissão", "configurar comissão", "percentual profissional"],
  },
  {
    id: "cadastrar-produto",
    category: "Estoque",
    question: "Como cadastro um produto no estoque?",
    steps: [
      "Abra o menu Estoque e clique em \"Novo produto\".",
      "Preencha nome, categoria, quantidade, unidade, lote e validade (se aplicável), custo, preço e estoque mínimo.",
      "Salve. Se a quantidade ficar igual ou abaixo do estoque mínimo, ou a validade estiver próxima/vencida, o produto aparece com um alerta na lista e na Tela Hoje.",
    ],
    keywords: ["produto", "estoque", "cadastrar produto", "insumo"],
  },
  {
    id: "gerar-relatorio",
    category: "Relatórios",
    question: "Como gero e exporto um relatório?",
    steps: [
      "Abra o menu Relatórios e clique na aba \"Relatórios\".",
      "Escolha o tipo de relatório (Leads, Orçamentos, Financeiro, etc.) na lista de abas.",
      "Ajuste os filtros disponíveis (período, profissional, status, origem ou paciente) e clique em \"Filtrar\".",
      'Use os botões "CSV" ou "Excel" para baixar os dados filtrados.',
    ],
    keywords: ["relatório", "exportar", "csv", "excel"],
  },
  {
    id: "criar-usuario",
    category: "Configurações e permissões",
    question: "Como convido um novo usuário para a equipe?",
    steps: [
      "Vá em Configurações > Usuários e permissões (apenas o Dono/Admin vê essa tela).",
      'Clique em "Convidar usuário".',
      "Preencha nome, e-mail e escolha o perfil (Gerente, Recepção/Comercial, Profissional ou Financeiro).",
      "A pessoa recebe um e-mail para definir a própria senha e acessar o sistema.",
    ],
    keywords: ["novo usuário", "convidar", "equipe"],
  },
  {
    id: "alterar-permissoes",
    category: "Configurações e permissões",
    question: "Como altero as permissões de um usuário?",
    steps: [
      "Vá em Configurações > Usuários e permissões.",
      'Na linha do usuário, clique em "Permissões".',
      "Ative ou desative cada permissão individualmente (ver/editar CRM, pacientes, prontuário, agenda, orçamentos, sessões, financeiro, estoque, relatórios, etc.).",
      'Se quiser voltar ao padrão do perfil da pessoa, use "Restaurar padrão do perfil".',
    ],
    keywords: ["permissões", "alterar permissão", "acesso"],
  },
  {
    id: "importar-planilha",
    category: "Configurações e permissões",
    question: "Como importo dados de uma planilha?",
    steps: [
      "Vá em Configurações > Importação.",
      'Clique em "Baixar modelo" no tipo de dado que quer importar (Pacientes, Procedimentos, Agenda ou Financeiro) — é um arquivo CSV.',
      "Preencha a planilha seguindo o modelo (pode abrir e editar no Excel ou Google Sheets) e salve como CSV novamente.",
      "Envie o arquivo preenchido e clique em Importar. O sistema mostra quantos registros entraram e o motivo de cada linha que não pôde ser importada.",
      "Importe Pacientes e Procedimentos antes de Agenda e Financeiro, porque esses dois procuram o paciente pelo nome.",
    ],
    keywords: ["importar", "planilha", "csv", "migrar dados"],
  },
];
