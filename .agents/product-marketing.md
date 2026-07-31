# EstéticaOS: contexto de marketing do produto

Fonte canônica de posicionamento, voz e claims para qualquer agente que
escreva texto público do EstéticaOS (landing, metadata, e-mails, anúncios,
redes). As skills de copywriting, copy-editing, marketing-psychology e
marketing-ideas leem este arquivo antes de perguntar qualquer coisa.

**Não duplique este conteúdo em outros arquivos.** `.agents/` é a fonte
canônica para Claude Code e Codex. `AGENTS.md` cobre regras de código,
este arquivo cobre comunicação.

Última auditoria contra o código: 2026-07-31.

---

## Público-alvo

Donas e gestoras de clínicas de estética no Brasil, com equipe pequena
(de 1 a 10 pessoas: esteticistas, biomédicas, recepção). Perfil
hands-on, que atende e administra ao mesmo tempo, com pouca paciência
para implantação longa e treinamento.

Quem mais usa o sistema: recepção, profissionais que atendem, e quem
cuida do financeiro. A landing fala com a gestora, que é quem decide.

## Problema central

A informação da mesma paciente vive espalhada entre caderno, planilha,
WhatsApp e, às vezes, um sistema genérico que não foi feito para
estética. Nenhum desses lugares conversa com o outro, e juntar tudo vira
trabalho manual que sobra para o fim do dia.

Sistemas genéricos (salão, consultório, loja) não têm o que a estética
precisa: anamnese por procedimento, termo de consentimento assinado,
foto de evolução por sessão, pacote de sessões e comissão por
procedimento.

## Posicionamento

> O EstéticaOS é o sistema de gestão desenvolvido para clínicas de
> estética: a operação clínica, comercial e financeira da mesma paciente
> em um só fluxo, do primeiro contato ao retorno.

Formulações aprovadas para a diferenciação:

- "feito só para estética"
- "desenvolvido para clínicas de estética"
- "pensado para a rotina da estética"

**Proibido:** "o único sistema do mercado", "o melhor", "líder" e
qualquer superlativo de mercado. Não existe pesquisa que sustente.

## Diferenciais comprováveis

Cada item abaixo tem tela e migração correspondentes no repositório.

| Diferencial | Prova no código |
|---|---|
| Anamnese por procedimento, enviada por link ao celular da paciente | `0004_anamnesis.sql`, `/anamnese/[token]`, `/configuracoes/anamnese` |
| Termo de consentimento assinado na tela, com data e hora | `0011_consent_templates.sql`, `/termo/[token]`, `components/signature` |
| Fotos de evolução por sessão, em bucket privado | `0008_prontuario.sql` (bucket `patient-media`, `public: false`) |
| Pacotes de sessões com assinatura a cada atendimento | `0007_sessions.sql`, `/sessoes` |
| Comissão percentual ou fixa, por profissional e/ou procedimento | `0016_termos_comissoes_profissao.sql`, `/configuracoes/comissoes` |
| Estoque com quantidade mínima **e** validade | `0010_estoque.sql`, `lib/estoque/types.ts` |
| Isolamento entre clínicas por RLS no banco | 26 tabelas com RLS, 31 policies |
| Permissões granulares por usuário (22 chaves, 5 perfis) | `lib/auth/permissions.ts` |
| Instalável como aplicativo (PWA) | `app/manifest.ts` |

## Funcionalidades existentes

**Atendimento:** agenda por profissional com cor e status; prontuário;
anamnese digital; termo de consentimento; fotos de evolução; pacotes e
sessões.

**Comercial:** CRM de leads por estágio, com origem, valor potencial,
alerta de lead parado e de follow-up vencido; orçamentos com PDF;
vendas; recibo com nome, endereço e CNPJ da clínica; lista de pacientes
inativos para reativação; aniversariantes.

**Gestão:** contas a pagar e a receber com forma de pagamento;
comissões; estoque com mínimo e validade; meta do mês; relatórios
(leads, conversão do CRM por origem, orçamentos, vendas, financeiro,
comissões, agenda, sessões, pacientes, estoque, anamneses) com filtro de
período e exportação; receita por profissional; usuários e permissões;
importação e exportação em Excel ou CSV.

**Conta:** teste de 7 dias (`TRIAL_DAYS`), cadastro sem cartão, bloqueio
das telas internas quando o teste vence, ativação do plano na tela
`/plano` por Pix ou cartão de crédito recorrente.

## Preço público

Decidido e publicado. Fonte única no código: `lib/plan/pricing.ts`.
**Nunca escreva o valor à mão em componente, texto ou metadata**, importe
das constantes: preço repetido em cinco arquivos fica desatualizado em
quatro.

| Item | Valor | Constante |
|---|---|---|
| Plano mensal | R$ 217 por mês | `PLAN_MONTHLY_PRICE_CENTS` |
| Plano anual | R$ 1.997 por ano | `PLAN_YEARLY_PRICE_CENTS` |
| Equivalente mensal no anual | R$ 167 por mês | `PLAN_YEARLY_EQUIVALENT_CENTS` |
| Economia do anual | R$ 607 por ano | `PLAN_YEARLY_SAVINGS_CENTS` |
| Teste grátis | 7 dias, sem cartão | `TRIAL_DAYS` |

Nome do plano: **EstéticaOS Completo** (`PLAN_NAME`). Um plano só, sem
níveis, sem módulo cobrado à parte e sem cobrança por profissional ou por
paciente.

Formas de pagamento anunciáveis: **Pix** e **cartão de crédito com
renovação automática**. Nunca citar o nome do provedor de pagamento em
texto público.

## Claims permitidos

- "7 dias com todos os recursos liberados. Sem cartão de crédito."
- "Profissionais e pacientes ilimitados." (não há cap em lugar nenhum do
  código; nenhuma tela cobra ou limita por quantidade)
- "R$ 217 por mês, ou R$ 1.997 por ano, equivalente a R$ 167 por mês."
- "Nada é apagado quando o teste termina." (não há rotina de exclusão)
- "Desde o primeiro dia, a tela mostra quantos dias faltam para o teste
  terminar." (`components/plan/TrialBanner.tsx`, visível o teste inteiro)
- "Quando o teste vence, as telas da clínica ficam pausadas até a
  ativação do plano." (`lib/plan/gate.ts` + layout de `(dashboard)`)
- "Ative no Pix ou no cartão, dentro do sistema." (a tela existe; ver a
  ressalva de provedor na tabela de pendências)
- "Cada clínica só enxerga os próprios dados, por regra no banco."
- "As fotos de prontuário ficam em armazenamento privado."
- "A recepção marca horário sem enxergar o caixa." (padrão do perfil
  `reception` não inclui `finance_view`)
- "Importe pacientes, procedimentos, agenda e lançamentos financeiros de
  planilha, com relatório linha a linha do que não entrou."
- "Exporte pacientes, procedimentos, agenda, lançamentos financeiros e
  os relatórios em Excel ou CSV."
- "Abre em qualquer navegador e instala na tela inicial do celular."
- "Comissão percentual ou fixa, por profissional, por procedimento ou
  pelos dois."

## Claims proibidos ou ainda não comprovados

Estes já apareceram em versões anteriores da landing e foram removidos.
**Não reintroduzir sem antes implementar e reauditar.**

| Claim | Situação |
|---|---|
| "A agenda não deixa marcar dois no mesmo horário" | **Falso.** Não existe bloqueio de sobreposição. `lib/agenda/grouping.ts` só agrupa para renderizar. |
| Total do dia em R$ no rodapé da agenda | **Falso.** A agenda real não soma o dia. |
| "Faturamento, comissão e contas na primeira tela" | **Parcial.** `/hoje` não mostra comissão; ela vive em Relatórios e Financeiro. |
| "Relatório de procedimento mais vendido" | **Falso.** Não existe esse relatório. |
| "O profissional vê só os próprios atendimentos" | **Falso.** O perfil `professional` tem `agenda_view` sem escopo por profissional. |
| "Sincroniza com o WhatsApp" | **Falso.** O WhatsApp é aberto por link (`wa.me`), sem integração. |
| "Exporte todos os seus dados" | **Parcial.** A exportação não cobre prontuário, fotos nem anamneses. |
| "Cadastro só com nome da clínica e e-mail" | **Falso.** Pede nome, clínica, e-mail, telefone, senha e confirmação de e-mail. |
| "Pronto em 2 / 10 / 5 minutos" | **Não medido.** Nunca cronometrado. Não prometer tempo. |
| "Cancele quando quiser" | **Sem fluxo.** Não existe cancelamento self-service no produto. O estado `canceled` existe no banco, mas quem cancela ainda é uma pessoa, na mão. |
| "Pagamento automático", "cobrança recorrente já funcionando" | **Liberado com ressalva.** O provedor está ligado e a renovação é automática. Só afirmar isso enquanto as variáveis de checkout e o webhook estiverem configurados em produção. Ver a tabela de pendências. |
| "Emitimos nota fiscal" | **Não existe.** Nenhuma emissão de NF no sistema. |
| Citar o nome do provedor de pagamento na landing | **Proibido.** Detalhe de implementação, não argumento de venda. |
| "Suporte sempre humano", "resposta em X horas" | **Decisão comercial não confirmada.** Pode-se oferecer o WhatsApp como canal, sem prometer prazo nem quem atende. |
| LGPD, criptografia específica, backup, certificação | **Sem prova documental.** Falar só de RLS e bucket privado. |
| Depoimentos, número de clínicas, nota, selo | **Não existem.** Nunca inventar. |

### Pendências de cobrança, e o que já pode ser dito

O provedor está ligado. A tela de Plano mostra o preço, o estado da
conta e um botão que leva ao checkout hospedado, onde a pessoa escolhe
Pix ou cartão. Detalhes em `docs/cakto.md`.

| Item | Estado | O que a interface faz hoje |
|---|---|---|
| Checkout mensal e anual | Ligado | `startCheckout(cycle)` devolve a URL do provedor com a clínica identificada |
| Escolha de Pix ou cartão | Fora do sistema | Acontece na tela do provedor. **Nunca gerar QR Code aqui dentro** |
| Webhook de confirmação | Ligado | `POST /api/webhooks/cakto`, com segredo conferido |
| Ativação da assinatura | Automática pelo webhook | Só a service role escreve `plan_status`, no servidor |
| Cancelamento pelo cliente | **Não existe** | Não dizer "cancele quando quiser" |
| Nota fiscal | **Não existe** | — |

Duas condições antes de anunciar cobrança automática em texto público:

1. `CAKTO_CHECKOUT_MONTHLY_URL`, `CAKTO_CHECKOUT_YEARLY_URL` e
   `CAKTO_WEBHOOK_SECRET` configuradas em produção, e o webhook criado
   no painel do provedor.
2. **Confirmar que a oferta de assinatura aceita Pix.** A landing diz
   "Pelo Pix ou por cartão de crédito com renovação automática". Se a
   oferta recorrente só aceitar cartão, essa frase vira claim falso e
   precisa ser corrigida — quem sabe quais formas estão liberadas é o
   provedor, não o código.

Regra que não se negocia: **assinatura só vira `active` por confirmação
do provedor**. Nenhum botão, nenhuma action e nenhuma tela pode marcar
pagamento aprovado por conta própria.

## Voz da marca

Profissional e calorosa, sem corporativês. Português brasileiro natural
e conversacional, como uma pessoa que já trabalhou em clínica
explicando para outra.

- Uma ideia por frase. Parágrafos curtos.
- Fala do que acontece na clínica, não do que o software faz.
- Específico vence bonito. Prefira "a foto daquela sessão" a
  "gestão visual do histórico".
- Equilibre dor e aspiração: clareza, tranquilidade, profissionalismo,
  segurança para decidir, controle para crescer.
- Nunca culpe a leitora. O problema é o arranjo, não o esforço dela.
- Sem escassez falsa, contagem regressiva ou urgência inventada.

**Evitar:** "revolucione", "eleve", "potencialize", "solução
definitiva", "transforme sua gestão", "otimize", "robusto", "inovador".

**Fórmulas banidas:** "não é X, é Y"; "completo como X, simples como Y";
títulos incompletos do tipo "Você provavelmente já tentou uma destas
três"; três frases curtas seguidas em sequência.

**Absolutos banidos sem prova:** "sozinho", "nunca", "sempre",
"garantido", "não deixa".

## CTA

- **Principal, em toda a página:** "Testar grátis" → `/cadastro`
- **Secundário no herói:** "Ver o sistema por dentro" → `#por-dentro`
- **"Entrar"** aparece só no cabeçalho, nunca como CTA de seção.
- Redução de risco que acompanha o CTA: "7 dias com todos os recursos
  liberados. Sem cartão de crédito."
- Na seção de preço: "Teste por 7 dias. Se fizer sentido para a sua
  rotina, ative o plano no Pix ou cartão."

O preço é público e fica na própria página, na seção `#preco`. **Não
mandar ninguém para o WhatsApp para saber quanto custa**: preço escondido
atrás de conversa é o que faz a leitora fechar a aba. O WhatsApp continua
sendo canal de dúvida, nunca de negociação de valor.

## Regras de pontuação

- **Travessão (`—`) e meia-risca (`–`) são proibidos** em qualquer texto
  visível, metadata, Open Graph, JSON-LD ou descrição do manifest. Use
  ponto, vírgula, dois-pontos, ponto e vírgula ou uma frase nova.
  (Comentários de código podem usar; não são texto público.)
- Sem ponto de exclamação.
- Sem caixa alta decorativa e sem tracking esticado em rótulo de seção.
- Números de verdade em fonte monoespaçada; texto corrido em sans.

## Vocabulário

| Use | Onde | Não use |
|---|---|---|
| **paciente** | prontuário, agenda, anamnese, atendimento, sessões | cliente |
| **lead** ou **cliente em potencial** | CRM, funil, antes de fechar | contato, prospect |
| **clínica** | a conta, o negócio da leitora | empresa, estabelecimento, salão |
| **equipe** | as pessoas com acesso | colaboradores, funcionários, usuários (no texto de venda) |
| **profissional** | quem atende | especialista, terapeuta |

Nomes de tela citados no texto público devem bater com o menu real:
Hoje, Agenda, Pacientes, CRM, Orçamentos, Sessões, Financeiro, Estoque,
Relatórios, Configurações, Plano.

---

## Como reauditar antes de publicar texto novo

1. Para cada afirmação, localize a tela, a action ou a migração que a
   sustenta. Sem prova, a frase sai.
2. Rode `npm run lint` e `npm run build`.
3. Busque travessão no texto renderizado, não só no código.
4. Confira a hierarquia: um `h1`, um `header`, um `main`.
5. Teste em 320, 375, 768, 1024 e 1440 px, nos dois temas, com teclado
   e com `prefers-reduced-motion`.
