# SMTP — e-mails de autenticação

O EstéticaOS dispara três e-mails, todos pelo Supabase Auth:

| Quando | Template no Supabase | Para onde o link leva |
| --- | --- | --- |
| Cadastro de uma clínica nova | Confirm signup | `/auth/callback?next=/hoje` |
| "Esqueci minha senha" | Reset password | `/auth/callback?next=/redefinir-senha` |
| Dono cadastra alguém da equipe | Invite user | `/auth/callback?next=/redefinir-senha` |

Sem SMTP próprio, o Supabase manda por um servidor de cortesia com limite
baixo (poucos e-mails por hora, contados no projeto inteiro) e sem
garantia de entrega. É por isso que `createUser` tem um caminho de
emergência: quando o convite não sai, ele cria a conta assim mesmo e
devolve o link para o dono mandar por WhatsApp. Com SMTP configurado esse
caminho vira exceção, mas continua no código de propósito — provedor
nenhum tem 100% de disponibilidade.

## Provedor: Resend

Escolhido por ser específico para e-mail transacional, ter a melhor
entrega em caixa de entrada e uma configuração de DNS curta. Gratuito até
3.000 e-mails/mês, que cobre com folga o volume de cadastros e
redefinições de senha.

### 1. Criar a conta e verificar o domínio

1. Crie a conta em [resend.com](https://resend.com).
2. **Domains > Add Domain**: `esteticaos.com`.
3. O Resend mostra os registros a criar. São três, e todos vão no DNS da
   Hostinger:

   | Tipo | Nome | Para que serve |
   | --- | --- | --- |
   | TXT | `send.esteticaos.com` | SPF — autoriza o Resend a enviar em nome do domínio |
   | TXT | `resend._domainkey` | DKIM — assina cada mensagem, provando que não foi forjada |
   | MX | `send.esteticaos.com` | Recebe os retornos de quem não existe mais |

   **Copie os valores da tela do Resend**, não daqui: a chave DKIM é
   única por domínio.

4. Espere a verificação virar "Verified". Costuma levar minutos, mas o
   DNS da Hostinger pode demorar algumas horas.

### 2. Pegar a credencial de SMTP

Em **API Keys > Create API Key**, permissão de envio. Guarde a chave: ela
aparece uma vez só.

### 3. Ligar no Supabase

**Authentication > Emails > SMTP Settings**, ative *Enable Custom SMTP*:

| Campo | Valor |
| --- | --- |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | a API key do passo 2 |
| Sender email | `nao-responda@esteticaos.com` |
| Sender name | `EstéticaOS` |

Porta 465 é conexão cifrada do início ao fim. Se a Vercel ou o Supabase
reclamarem de conexão, a alternativa é 587 com STARTTLS.

O remetente não precisa ser uma caixa que existe — só precisa estar no
domínio verificado. `nao-responda@` deixa claro para quem recebe que ali
não adianta responder.

### 4. Trocar os textos dos e-mails

Os modelos que vêm com o Supabase são em inglês e sem marca nenhuma. Em
**Authentication > Emails**, abra cada template e cole o conteúdo
correspondente:

| Template | Arquivo |
| --- | --- |
| Confirm signup | `docs/emails/confirmacao-cadastro.html` |
| Reset password | `docs/emails/redefinir-senha.html` |
| Invite user | `docs/emails/convite-equipe.html` |

Ajuste também o **Subject** de cada um:

- Confirm signup: `Confirme seu e-mail — EstéticaOS`
- Reset password: `Criar uma nova senha — EstéticaOS`
- Invite user: `Seu acesso à clínica está pronto — EstéticaOS`

Os arquivos usam `{{ .ConfirmationURL }}` e `{{ .Email }}`, que o
Supabase substitui no envio. Mantenha essas marcações como estão.

### 5. Conferir

1. Cadastre uma clínica com um e-mail seu de verdade e confirme que a
   mensagem chega **na caixa de entrada**, não no spam.
2. Repita com um endereço de outro provedor — Gmail e Outlook filtram de
   formas diferentes.
3. Peça "esqueci minha senha" e confira se o link abre a tela certa.
4. Cadastre um usuário de equipe e veja se o convite chega sem cair no
   caminho de emergência (se cair, aparece o aviso com o link manual na
   própria tela).

Se cair no spam, quase sempre falta o DMARC. Ele não é obrigatório para
enviar, mas ajuda bastante na reputação — adicione no DNS da Hostinger:

| Tipo | Nome | Valor |
| --- | --- | --- |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:contato@esteticaos.com` |

`p=none` só monitora, sem bloquear nada. Depois de umas semanas sem
problema, dá para endurecer para `p=quarantine`.

## Ordem importa

O domínio precisa estar apontado e verificado **antes** do SMTP: o Resend
só libera o envio depois de confirmar que `esteticaos.com` é seu. E o
`NEXT_PUBLIC_SITE_URL` precisa já estar valendo, senão os e-mails saem
com link para o endereço antigo da Vercel — o e-mail chega bonito e leva
a pessoa para o lugar errado.
