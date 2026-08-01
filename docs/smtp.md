# SMTP — e-mails de autenticação

O EstéticaOS dispara três e-mails, todos pelo Supabase Auth:

| Quando | Template no Supabase | Para onde o link leva |
| --- | --- | --- |
| Cadastro de uma clínica nova | Confirm signup | `/auth/confirm?type=signup&next=/hoje` |
| "Esqueci minha senha" | Reset password | `/auth/confirm?type=recovery&next=/redefinir-senha` |
| Dono cadastra alguém da equipe | Invite user | `/auth/confirm?type=invite&next=/redefinir-senha` |

## O domínio do link não sai do nosso código

Vale entender isto antes de qualquer outra coisa, porque é a causa mais
comum de link quebrado.

**Quem escolhe o endereço do link é o Supabase, não o EstéticaOS.** Nos
templates com `{{ .SiteURL }}`, o endereço vem do campo *Site URL* do
projeto. Nos links que passam por `/auth/v1/verify`, vem do `redirect_to`
conferido contra a lista de *Redirect URLs* — e quando não bate, o
Supabase larga a pessoa na *Site URL* de novo.

Ou seja: se a *Site URL* apontar para um endereço antigo, **todo convite
sai apontando para lá**, por mais correto que esteja o repositório.
Nenhum deploy conserta isso; é um campo no painel.

O domínio oficial é **`https://esteticaos.com`**. Ele precisa estar, com
esse texto exato e sem barra no fim, em três lugares:

| Onde | Campo |
| --- | --- |
| Vercel > Settings > Environment Variables | `NEXT_PUBLIC_SITE_URL` |
| Supabase > Authentication > URL Configuration | **Site URL** |
| Supabase > Authentication > URL Configuration | primeira das **Redirect URLs** |

Como rede de segurança, o proxy do sistema (`src/proxy.ts`, via
`src/lib/canonical-host.ts`) devolve para o domínio oficial qualquer
requisição que chegue por outro endereço, levando caminho e query
intactos. Um link antigo, apontando para o domínio da Vercel, funciona
assim mesmo. Isso existe para links que já foram enviados — **não é
motivo para deixar a Site URL errada**, porque o e-mail que a pessoa
recebe continua mostrando o endereço errado na barra de endereço.

Deploys de *preview* ficam de fora dessa canonização: cada PR precisa
continuar navegável no endereço próprio.

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

Os arquivos usam `{{ .TokenHash }}`, `{{ .SiteURL }}` e `{{ .Email }}`,
que o Supabase substitui no envio. Mantenha essas marcações como estão.

**Por que não `{{ .ConfirmationURL }}`.** Essa variável monta um link
para `/auth/v1/verify` no Supabase, que confere o `redirect_to` contra a
lista de Redirect URLs e, quando não bate, larga a pessoa na Site URL:
foi assim que o convidado foi parar na landing em vez da tela de senha.
E mesmo quando bate, o `verify` devolve a sessão no fragmento da URL
(`#access_token=...`), que o navegador nunca envia ao servidor — uma
aplicação com sessão em cookie não enxerga nada ali.

Com `{{ .TokenHash }}` o e-mail aponta direto para o EstéticaOS, sem
intermediário e sem lista de destinos para casar. Cada template tem o
seu tipo:

| Template | Link do botão |
| --- | --- |
| Confirm signup | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/hoje` |
| Reset password | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/redefinir-senha` |
| Invite user | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/redefinir-senha` |

Nos arquivos o `&` aparece como `&amp;`, que é o certo dentro de HTML. O
cliente de e-mail decodifica sozinho.

### 5. Liberar os destinos com curinga

**Authentication > URL Configuration > Redirect URLs.**

Este é o passo que quebrou o convite na primeira vez que os e-mails
funcionaram. O link do e-mail não aponta para o EstéticaOS: ele aponta
para `/auth/v1/verify` no Supabase, que confere o `redirect_to` contra
esta lista e só então manda a pessoa para cá. **Entrada sem curinga casa
com a URL inteira, query incluída.** Então `.../auth/callback` não casa
com `.../auth/callback?next=/redefinir-senha`, o Supabase descarta o
destino e joga a pessoa na Site URL, ou seja, na landing.

Deixe a lista assim, com o `?**` no fim de cada uma:

```
https://esteticaos.com/auth/callback?**
https://esteticaos.com/auth/confirm?**
https://www.esteticaos.com/auth/callback?**
http://localhost:3000/auth/callback?**
http://localhost:3000/auth/confirm?**
```

Pode manter também as versões sem curinga; elas não atrapalham.

**Sobre `estetica-os-plum.vercel.app`:** o endereço interno da Vercel não
é o domínio oficial e **não deve gerar link novo nenhum**. Se você
mantiver `https://estetica-os-plum.vercel.app/auth/callback?**` na lista,
que seja só como compatibilidade temporária, para não invalidar convites
que já foram enviados antes da troca de domínio — e o proxy vai devolver
essas pessoas para `esteticaos.com` de qualquer forma. Passadas algumas
semanas, remova a linha. O que **não** pode acontecer é esse endereço
aparecer na *Site URL*: ali ele volta a virar o domínio de todo e-mail
novo.

O código tem duas redes de segurança para o caso de esta lista sair do
ar de novo, mas nenhuma substitui o ajuste acima:

1. `/auth/callback` deduz o destino quando o `next` não chega: quem tem
   `invited_at` e nunca entrou vai para `/redefinir-senha`.
2. A landing devolve para `/auth/callback` qualquer `?code=` que caia
   nela, em vez de engolir o código.

### 6. Conferir

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
