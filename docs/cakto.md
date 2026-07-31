# Cobrança — Cakto

O EstéticaOS cobra a assinatura pela **Cakto**. O checkout é hospedado
por eles; o sistema não coleta cartão, não gera QR Code de Pix e não
sabe qual forma de pagamento a pessoa escolheu.

A regra que vale acima de todas: **quem libera o acesso é o webhook**.
Clicar em "Ativar plano" só leva a pessoa para a tela de pagamento.
Nenhum botão, nenhuma tela e nenhuma action marca clínica como paga.

---

## 1. Como funciona, do começo ao fim

1. Na tela **Plano**, a dona da clínica escolhe **mensal** ou **anual** e
   clica em **Ativar plano**.
2. O sistema monta a URL do produto na Cakto já com a clínica
   identificada e os dados dela preenchidos, e manda a pessoa para lá.
3. Na Cakto ela escolhe Pix ou cartão e paga.
4. A Cakto dispara um evento para `POST /api/webhooks/cakto`.
5. A rota confere o segredo, descobre de qual clínica é aquele
   pagamento e grava `plan_status = 'active'`.
6. No próximo carregamento de tela, o sistema está liberado.

No Pix há alguns segundos entre pagar e o evento chegar. A tela de Plano
avisa isso.

---

## 2. Variáveis de ambiente

| Variável | Para quê | Obrigatória |
|---|---|---|
| `CAKTO_CHECKOUT_MONTHLY_URL` | Link de checkout do ciclo mensal | Para cobrar mensal |
| `CAKTO_CHECKOUT_YEARLY_URL` | Link de checkout do ciclo anual | Para cobrar anual |
| `CAKTO_WEBHOOK_SECRET` | Segredo que autoriza o webhook | **Sim**, senão a rota recusa tudo |
| `CAKTO_API_CLIENT_ID` / `CAKTO_API_CLIENT_SECRET` | API da Cakto | Não. A integração atual não usa |

Valores em uso hoje:

```
CAKTO_CHECKOUT_MONTHLY_URL=https://pay.cakto.com.br/36h8hoh_1014418
CAKTO_CHECKOUT_YEARLY_URL=https://pay.cakto.com.br/ww6fjqv
```

Só são aceitas URLs `https` no domínio `pay.cakto.com.br`. Uma variável
trocada por engano não vira redirecionamento para qualquer lugar da
internet a partir de um botão do sistema.

Para gerar o segredo:

```bash
openssl rand -hex 32
```

O **mesmo texto** vai no `.env.local` (e nas variáveis da Vercel) e no
campo *Secret* do webhook no painel da Cakto. Se os dois não baterem, a
rota devolve `401` e nenhuma assinatura é ativada.

---

## 3. Passo a passo no painel da Cakto

### 3.1 Conferir os links de checkout

1. Entre no painel da Cakto.
2. **Produtos** → abra **EstéticaOS Completo**.
3. Confira que existem duas ofertas: uma mensal (R$ 217) e uma anual
   (R$ 1.997), as duas do tipo **assinatura/recorrente**.
4. Copie o link de checkout de cada uma e confirme que são os mesmos das
   variáveis acima.

> **Confirme também quais formas de pagamento a oferta aceita.** A
> landing e a tela de Plano falam em "Pix ou cartão". Se a oferta de
> assinatura não aceitar Pix, esse texto precisa ser corrigido antes de
> ir para o ar — ver `.agents/product-marketing.md`.

### 3.2 Criar o webhook

1. No painel, vá em **Configurações → Webhooks** (ou **Integrações →
   Webhooks**) e clique em criar/adicionar.
2. **URL:**

   ```
   https://esteticaos.com/api/webhooks/cakto
   ```

3. **Secret:** cole exatamente o mesmo valor de `CAKTO_WEBHOOK_SECRET`.
4. **Produto:** selecione **EstéticaOS Completo** (as duas ofertas, se a
   seleção for por oferta).
5. **Eventos:** marque **só** estes oito:

   - [x] Compra aprovada
   - [x] Compra recusada
   - [x] Reembolso
   - [x] Chargeback
   - [x] Assinatura criada
   - [x] Assinatura renovada
   - [x] Assinatura cancelada
   - [x] Renovação de assinatura recusada

   **Não marque:** Pix gerado, Boleto gerado, PicPay gerado, Nubank
   gerado, Abandono de checkout, Início de checkout. Nenhum deles
   significa dinheiro recebido. (Se algum chegar mesmo assim, a rota
   responde 200 e não mexe em nada — mas não há por que gastar envio.)

6. Salve.

### 3.3 Testar

A Cakto tem um botão de **enviar evento de teste** na tela do webhook.
Dispare e confira nos logs da Vercel se apareceu uma linha começando com
`[cakto]`.

---

## 4. Como o pagamento acha a clínica certa

Este é o ponto mais delicado da integração: o dinheiro chega na Cakto e
o sistema precisa saber **de quem é**.

Ao montar a URL do checkout, o EstéticaOS acrescenta a identificação da
clínica nos parâmetros de rastreamento que a Cakto aceita:

```
https://pay.cakto.com.br/36h8hoh_1014418
  ?sck=<clinic_id>_monthly
  &utm_source=esteticaos&utm_medium=app
  &utm_campaign=monthly&utm_content=<clinic_id>
  &name=...&email=...&confirmEmail=...&phone=55...
```

`sck` é descrito pela Cakto como *"parâmetro personalizado, geralmente
usado internamente para rastrear algo específico"* — exatamente o uso
aqui. Os campos `name`, `email`, `confirmEmail` e `phone` pré-preenchem
o formulário, o que reduz a chance de a pessoa pagar com um e-mail
diferente do e-mail da conta.

No webhook, a busca é feita em três tentativas, da mais firme para a
mais frágil:

| Ordem | Como | Quando funciona |
|---|---|---|
| 1 | `data.subscription.id` bate com `clinics.billing_subscription_id` | Da segunda cobrança em diante. É prova direta |
| 2 | Referência `<clinic_id>_<ciclo>` encontrada no payload | Se a Cakto devolver o `sck`/`utm_content` no evento |
| 3 | `data.customer.email` bate com o e-mail do dono ou da clínica | Primeira compra, quando a referência não volta |

Se nada bater, ou se o e-mail bater com **duas** clínicas, o sistema
**não escolhe**. Ele devolve 200, não muda nada e grava no log:

```
[cakto] PAGAMENTO SEM CLÍNICA — ativar na mão {"event":"purchase_approved","reason":"clinic_not_found","order":"6HngVo6",...}
```

O `order` é o `refId` da venda: com ele dá para achar a compra no painel
da Cakto e ativar a clínica na mão. Marcar a clínica errada como paga
seria dar o sistema de graça para uma e cobrar de outra — é por isso que
ele prefere não adivinhar.

### Limitação conhecida

Os exemplos de payload publicados pela Cakto **não mostram** os campos
de rastreamento (`sck`, `utm_*`), embora eles existam no objeto de
pedido da API. Ou seja: não dá para garantir que a referência volte no
evento. Por isso a busca varre o payload inteiro atrás dela (até quatro
níveis de profundidade) e, se não achar, cai no e-mail. Isso é seguro
porque a referência sozinha não autoriza nada — o UUID ainda é conferido
contra a tabela de clínicas.

**Vale conferir no primeiro pagamento real** se o log mostra
`"matched":"reference"` ou `"matched":"email"`. Se for sempre `email`, a
Cakto não está devolvendo o `sck` e a documentação aqui deve registrar
isso.

---

## 5. O que cada evento faz

| Evento (Cakto) | Efeito no `plan_status` | Observação |
|---|---|---|
| `purchase_approved` | `active` | Só se o pagamento estiver confirmado |
| `subscription_created` | `active` | Idem — assinatura criada com Pix pendente **não** libera |
| `subscription_renewed` | `active` | Renova `subscription_ends_at` |
| `purchase_refused` | `past_due` | Acesso continua liberado |
| `subscription_renewal_refused` | `past_due` | Acesso continua liberado |
| `refund` | `canceled` | Acesso bloqueado |
| `chargeback` | `canceled` | Acesso bloqueado |
| `subscription_canceled` | `canceled` | Acesso bloqueado |
| `pix_gerado`, `boleto_gerado`, `picpay_gerado`, `openfinance_nubank_gerado` | nenhum | Cobrança emitida ≠ cobrança paga |
| `initiate_checkout`, `checkout_abandonment` | nenhum | Intenção de compra |
| Evento novo, ainda não conhecido | nenhum | Registrado no log, resposta 200 |

### Por que estorno e chargeback viram `canceled`

Foram as duas decisões que o payload não decide sozinho:

- **`past_due` mantém o acesso liberado de propósito** — é para quem já
  paga não perder a agenda do dia porque o cartão venceu.
- Em estorno o dinheiro voltou para o cliente; em chargeback ele foi
  contestado e retido. Nos dois casos **não há pagamento de pé**, então
  tratar como `past_due` seria dar acesso liberado por tempo
  indeterminado a quem não pagou.
- Por isso os dois viram `canceled`, que bloqueia. Nada é apagado: se
  for engano, basta a Cakto confirmar a assinatura de novo (ou uma
  pessoa ajustar `plan_status` no banco) e tudo volta como estava.

### Travas que evitam liberar acesso por engano

1. **Cobrança emitida não é pagamento.** Ativar exige `status: "paid"`,
   ou assinatura `active` com pelo menos uma cobrança paga.
2. **Evento negativo só mexe em quem já assinou.** Uma clínica em teste
   nunca vira `past_due` nem `canceled` por evento da Cakto. Sem essa
   trava, deixar o cartão ser recusado de propósito viraria uma forma de
   destravar o sistema, porque `past_due` libera o acesso.
3. **Sem segredo configurado, a rota recusa tudo** com `503` — nunca
   processa "no modo aberto".

---

## 6. Testar o webhook localmente

Suba o sistema (`npm run dev`), com `CAKTO_WEBHOOK_SECRET` preenchido no
`.env.local`. Os exemplos ficam em `docs/cakto-payloads/`, com dois
lugares para substituir: `SEU_SEGREDO` e `CLINIC_ID`.

```bash
SECRET=$(grep '^CAKTO_WEBHOOK_SECRET=' .env.local | cut -d= -f2-)
CLINICA=00000000-0000-0000-0000-000000000000   # id de uma clínica de teste

sed -e "s/SEU_SEGREDO/$SECRET/" -e "s/CLINIC_ID/$CLINICA/" \
  docs/cakto-payloads/compra-aprovada.json \
| curl -sS -X POST http://localhost:3000/api/webhooks/cakto \
    -H 'Content-Type: application/json' --data-binary @- ; echo
```

Respostas esperadas:

```jsonc
// compra-aprovada.json         → clínica vira active
{"received":true,"handled":true}

// pix-gerado.json              → não libera nada
{"received":true,"handled":false,"reason":"ignored_event"}

// reembolso.json numa clínica que nunca pagou
{"received":true,"handled":false,"reason":"not_subscribed"}
```

Segredo errado (o teste que mais importa):

```bash
sed -e "s/SEU_SEGREDO/errado/" -e "s/CLINIC_ID/$CLINICA/" \
  docs/cakto-payloads/compra-aprovada.json \
| curl -sS -o /dev/null -w '%{http_code}\n' \
    -X POST http://localhost:3000/api/webhooks/cakto \
    -H 'Content-Type: application/json' --data-binary @-
# 401
```

O segredo também é aceito no cabeçalho `x-cakto-secret` ou em
`?secret=`, o que ajuda em teste manual. **Isso não é uma escolha de
projeto, é a limitação do provedor:** a Cakto não assina a requisição com
HMAC — ela manda o segredo em texto, dentro do corpo. Por isso o segredo
precisa ser longo, aleatório e trafegar só por HTTPS.

---

## 7. Onde fica cada coisa no código

| Arquivo | Papel |
|---|---|
| `src/lib/billing/cakto.ts` | Config, montagem da URL, tipos e mapa evento → efeito |
| `src/lib/billing/config.ts` | "Dá para cobrar?" e "o webhook está configurado?" |
| `src/lib/billing/apply-cakto-event.ts` | Acha a clínica e escreve o `plan_status` |
| `src/app/api/webhooks/cakto/route.ts` | A rota: confere o segredo, registra o log |
| `src/actions/billing.ts` | `startCheckout(cycle)` — devolve a URL da Cakto |
| `src/components/plan/CheckoutPanel.tsx` | Escolha do ciclo, na tela de Plano |
| `src/proxy.ts` | `/api/webhooks` é rota pública (quem bate é servidor) |

Colunas usadas em `public.clinics` (migração `0018_subscription.sql`, já
aplicada): `plan_status`, `billing_cycle`, `subscription_ends_at`,
`billing_customer_id`, `billing_subscription_id`.

Nenhuma migração nova é necessária para esta integração.

---

## 8. O que ainda não existe

- **Cancelamento pelo sistema.** O estado `canceled` chega pela Cakto; o
  cancelamento em si é feito no painel dela ou pelo suporte. Enquanto
  isso, não dizer "cancele quando quiser" em texto público.
- **Registro de eventos no banco.** Hoje o histórico vive no log da
  Vercel e no painel da Cakto. Uma tabela `billing_events` daria
  auditoria e proteção contra evento repetido — não é urgente, porque as
  atualizações são idempotentes (sempre gravam o estado final, não
  somam) e a Cakto não reenvia.
- **Emissão de nota fiscal.**
