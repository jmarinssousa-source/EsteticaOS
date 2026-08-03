# Segurança do EstéticaOS — decisões, limites e o que falta

Este documento é o registro honesto de como o sistema se defende, o que
ele ainda não faz e por quê. Não é material de marketing. Quem for mexer
em autenticação, permissão ou banco começa por aqui.

Última revisão: **3 de agosto de 2026**, numa auditoria completa do
repositório.

---

## 1. Como a autorização funciona hoje

São três camadas, e vale entender o que cada uma alcança:

| Camada | Onde | O que ela garante |
| --- | --- | --- |
| Proxy (`src/proxy.ts`) | Antes da página renderizar | Quem não tem sessão não abre rota privada. É otimista: renova o cookie e desvia, mas não consulta o banco. |
| Aplicação (`src/lib/auth/session.ts`, `src/actions/*`) | Servidor | Sessão, vínculo com a clínica, perfil e permissão granular. É aqui que a matriz de permissões vale. |
| Banco (RLS do Postgres) | Supabase | Isolamento entre clínicas e bloqueio de conta desativada. |

**A camada do banco não conhece permissões granulares.** As policies
conferem "esta linha é da clínica desta pessoa?" e "o vínculo está
ativo?" — nada além disso. Ver o item 3.1.

## 2. O que está resolvido

### 2.1 Isolamento entre clínicas

Toda tabela de dado tem `clinic_id` e uma policy que compara esse campo
com o resultado de `current_clinic_member()`. Trocar um id na URL ou na
chamada não leva a lugar nenhum: a linha simplesmente não existe para
aquela sessão. O Storage segue a mesma regra pelo primeiro segmento do
caminho (`{clinic_id}/{patient_id}/...`).

### 2.2 Conta desativada perde o acesso no banco

Corrigido na migração `0020_rls_membro_inativo.sql`. Antes, desativar
alguém só barrava o painel — a sessão do Supabase continuava válida e a
API REST continuava respondendo. Agora `current_clinic_member()` exige
`status = 'active'`, e isso vale para todas as tabelas de uma vez.

**Atenção:** desativar não encerra a sessão. A pessoa perde o acesso aos
dados imediatamente (a RLS é avaliada a cada consulta), mas o token dela
continua existindo até expirar. Para derrubar na hora, é preciso revogar
as sessões do usuário no painel do Supabase.

### 2.3 Senha e sessão

- Troca de senha derruba as outras sessões (`scope: "others"`).
- Convite exige criar senha antes de abrir o painel, e a exigência mora
  na conta, não no link.
- "Esqueci minha senha" responde igual para e-mail existente e
  inexistente — não dá para descobrir quem tem conta.
- Os links de e-mail entram por `token_hash`, de uso único.

### 2.4 Links do paciente (anamnese e termo)

`/anamnese/<token>` e `/termo/<token>` abrem sem login, autorizados só
pela posse do token: 24 bytes aleatórios (192 bits), gerados com
`crypto.randomBytes`. Não são adivinháveis. Ficam fora do índice pelo
`robots.txt`, e o `Referrer-Policy` impede que o endereço completo vaze
para outro site.

### 2.5 Pagamento

O webhook da Cakto é o único caminho que marca uma clínica como pagante.
Confere o segredo em tempo constante, recusa tudo se o segredo não estiver
configurado, e nunca ativa com base em cobrança apenas emitida (Pix
gerado, boleto gerado). Ver `src/lib/billing/`.

### 2.6 Cabeçalhos e CSP

CSP com `nonce` por requisição, sem `unsafe-inline` para script. Foi
verificada num navegador de verdade, com sessão real, percorrendo painel,
menus e diálogos: zero violações. O inventário do que ela libera e o
motivo de cada permissão está em `src/lib/security/csp.ts`.

`style-src` mantém `'unsafe-inline'` por necessidade: os componentes do
Base UI se posicionam escrevendo no atributo `style`, e `nonce` não vale
para atributo.

### 2.7 Arquivos

Foto de prontuário só entra em JPG, PNG, WEBP ou HEIC, com teto de 15 MB
por arquivo. O tipo gravado e a extensão saem de uma lista fechada, nunca
do que o navegador declarou — o que fecha o caminho de subir HTML e
receber de volta uma URL que o navegador abre como página.

### 2.8 Exportação

CSV exportado neutraliza célula começada por `=`, `+`, `-` ou `@`, que a
planilha leria como fórmula. O XLSX não precisa: as células são gravadas
como `inlineStr`, que o Excel nunca interpreta como fórmula.

---

## 3. Riscos conhecidos e ainda em aberto

### 3.1 A permissão granular não existe no banco — **risco alto, em aberto**

**O que é.** A chave `anon` do Supabase é pública por definição: ela vai
no navegador. Com ela e com o próprio token de sessão, qualquer pessoa da
equipe consegue falar direto com a API REST do Supabase, sem passar pelo
sistema. E ali só valem as policies do banco, que conferem a clínica —
não a permissão.

**Na prática.** Uma recepcionista sem `finance_view` não vê o Financeiro
na tela, mas consegue ler `financial_entries` da própria clínica por uma
chamada direta. O mesmo vale para prontuário, comissões e fotos.

**O que isso não é.** Não é vazamento entre clínicas: o isolamento
continua de pé. É um limite de confiança *dentro* da clínica.

**Por que ainda não foi corrigido.** A correção exige reescrever as
policies para consultarem o `permissions` (jsonb) e os padrões por perfil
— que hoje vivem em TypeScript (`src/lib/auth/permissions.ts`). Duplicar
essa tabela em SQL cria duas fontes de verdade que vão divergir. A
decisão de como fazer (mover os padrões para o banco? uma função
`tem_permissao(chave)`?) é de arquitetura, não de correção pontual, e
merece ser tomada com calma em vez de aplicada no meio de uma auditoria.

**Mitigação enquanto isso.** Convide para a equipe só quem já tem acesso
à informação da clínica de qualquer jeito. Trate os perfis como
organização de tela, não como barreira contra alguém mal-intencionado que
já está dentro.

### 3.2 Não existe trilha de auditoria — **risco médio, em aberto**

Nada registra quem abriu qual prontuário, quem mudou permissão de quem,
quem apagou o quê ou quem exportou a base. Para um sistema que guarda dado
de saúde isso é uma lacuna real: não é possível responder "quem viu isso?"
depois de um incidente, e a LGPD espera que o controlador consiga
responder.

O caminho seria uma tabela `audit_log` (clínica, autor, ação, alvo,
momento), escrita pelas actions sensíveis, sem `delete` para ninguém. É
funcionalidade nova, com decisão de produto junto (o que registrar, por
quanto tempo guardar, quem pode ler).

### 3.3 Não existe limite de tentativas próprio — **risco médio**

Login, recuperação de senha e cadastro dependem inteiramente dos limites
do Supabase Auth. As Server Actions e o webhook não têm limite nenhum. Um
atacante com o segredo do webhook, ou alguém tentando adivinhar token de
anamnese em volume, não encontra freio do nosso lado.

Os tokens têm 192 bits, o que torna a adivinhação inviável na prática. O
que falta é proteção contra abuso de volume (custo, ruído no log).

### 3.4 Reenvio de webhook não é registrado — **risco baixo**

Não há tabela de eventos recebidos. Reenviar um `purchase_approved`
antigo, de posse do segredo, reativaria uma assinatura cancelada. Exige
já ter o segredo, o que é um cenário estreito, mas um `billing_events`
com o id do evento e chave única resolveria de vez.

### 3.5 Convite pode vincular conta existente sem consentimento — **risco baixo**

Um dono pode convidar um e-mail que já tem conta no EstéticaOS mas não
pertence a nenhuma clínica; a conta é vinculada à clínica dele sem que a
pessoa aceite nada. O efeito é pequeno (a pessoa vê que está numa clínica
nova e pode sair), mas o certo seria pedir aceite.

### 3.6 Vulnerabilidades transitivas em `postcss` e `sharp` — **risco baixo**

Chegam pelo próprio `next` e só se resolvem em `next@16.3.0`. Ambas
exigem entrada controlada pelo atacante em lugares onde ela não existe
neste sistema: o CSS é o nosso, gerado no build, e as únicas imagens
otimizadas são as que o projeto publica. A subida de versão está
recomendada, mas pede teste — este Next tem mudanças incompatíveis entre
versões (ver `AGENTS.md`).

---

## 4. O que depende de configuração fora do repositório

Nenhum destes itens pode ser garantido por código. Confira no painel:

| Onde | O que conferir |
| --- | --- |
| Supabase → Auth → URL Configuration | Site URL e Redirect URLs apontando para o domínio oficial |
| Supabase → Auth → Providers | Proteção contra enumeração de e-mail ligada |
| Supabase → Database → Backups | Point-in-time recovery ligado e restauração testada |
| Supabase → Settings | Rotacionar `service_role` se ela já tiver circulado |
| Vercel | `NEXT_PUBLIC_SITE_URL` presente no build de produção |
| Vercel → Domains | Sem redirecionamento de domínio no sentido contrário ao do proxy |
| DNS | SPF, DKIM e DMARC do domínio de envio |
| GitHub → Settings → Branches | Proteção da `main`: revisão obrigatória, sem force push |
| GitHub → Settings → Security | Secret scanning e push protection ligados |

## 5. Dados pessoais que o sistema trata

Para quem for escrever a política de privacidade ou responder a um
titular, é isto que existe hoje:

- **Identificação do paciente:** nome, CPF, data de nascimento, telefone,
  e-mail, endereço, gênero.
- **Saúde:** prontuário, complicações, respostas de anamnese, fotos de
  evolução, mapas corporais e faciais marcados.
- **Consentimento:** termo assinado, com cópia do texto vigente na hora da
  assinatura e a assinatura desenhada.
- **Financeiro:** orçamentos, vendas, pagamentos, comissões.
- **Equipe:** nome, e-mail, perfil, profissão.

Exclusão de paciente hoje é apagar a linha (com cascata). Não existe
anonimização, prazo de retenção definido, nem exportação por titular —
existe exportação por clínica. Definir retenção e o que fazer no pedido
de exclusão de um titular é decisão de negócio e jurídica, não técnica.
