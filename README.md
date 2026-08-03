# EstéticaOS

Sistema de gestão desenvolvido para clínicas de estética: agenda, prontuário, fotos de evolução, anamnese, termo de consentimento, CRM de leads, orçamentos, financeiro, comissões, estoque e relatórios no mesmo fluxo, do primeiro contato ao retorno da paciente.

Stack: Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui, com Supabase (Postgres, Auth, RLS multi-clínica).

> Texto público (landing, metadata, e-mails, anúncios): o posicionamento, os claims permitidos e os proibidos ficam em [`.agents/product-marketing.md`](.agents/product-marketing.md). Leia antes de escrever qualquer coisa que saia para fora.

## Fase 1 — Fundação do SaaS

Escopo implementado: cadastro de clínica com verificação de e-mail, login, recuperação de senha, estrutura multi-clínica, perfis e permissões granulares, layout base com menu principal.

## Configuração

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **Project Settings > API**, copie a URL, a `anon key` e a `service_role key`.
3. Copie `.env.local.example` para `.env.local` e preencha os três valores.
4. Em **Authentication > URL Configuration**, adicione `http://localhost:3000/auth/callback?**` e `http://localhost:3000/auth/confirm?**` às Redirect URLs. Em produção, veja a seção de domínio próprio mais abaixo.
5. Confirme que **Authentication > Providers > Email > Confirm email** está habilitado (obrigatório para o fluxo de verificação de e-mail).
6. Rode, em ordem, o SQL de cada arquivo em `supabase/migrations/` (0001 até a última) no **SQL Editor** do Supabase — ou via Supabase CLI, se o projeto estiver linkado. A migração `0008_prontuario.sql` cria também o bucket de Storage `patient-media` (privado); confirme em **Storage** que ele existe após rodar essa migração.
7. Instale as dependências e suba o servidor:

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). O cadastro em `/cadastro` cria a clínica e o usuário Dono/Admin; os demais perfis (Gerente, Recepção/Comercial, Profissional, Financeiro) são convidados pelo Dono em **Configurações > Usuários e permissões**.

## Scripts

- `npm run dev` — ambiente de desenvolvimento (Turbopack)
- `npm run build` — build de produção
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript, sem gerar arquivo
- `npm test` — testes de regressão de segurança (`tests/`)

Os testes rodam no executor nativo do Node, sem framework e sem
dependência a mais, e por isso pedem **Node 22.18 ou mais novo** — é a
versão a partir da qual o Node lê TypeScript direto. A aplicação em si
roda a partir da 20.9.

Os quatro comandos rodam também na CI, a cada push e a cada pull request
(`.github/workflows/ci.yml`).

## Segurança

O que o sistema já protege, o que ainda não protege e o que depende de
configuração no painel do Supabase, da Vercel ou do DNS está em
[`docs/seguranca.md`](docs/seguranca.md). Quem for mexer em
autenticação, permissão ou banco começa por ali.

Para relatar uma falha, veja [`SECURITY.md`](SECURITY.md) — não abra
issue pública.

## Deploy (Vercel)

1. Em [vercel.com](https://vercel.com), **Add New > Project** e importe o repositório `jmarinssousa-source/EsteticaOS` do GitHub.
2. Vercel detecta o Next.js automaticamente — não precisa mudar build command nem output directory.
3. Em **Environment Variables**, adicione as mesmas quatro chaves de `.env.local` (veja `.env.local.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` — **nunca** prefixe com `NEXT_PUBLIC_`; sem esse prefixo o Next.js não inclui a variável no bundle enviado ao navegador, mantendo-a só no servidor.
   - `NEXT_PUBLIC_SITE_URL` — `https://esteticaos.com` em produção, usada para montar os links de confirmação de e-mail e redefinição de senha.
4. Clique em **Deploy**.

## Domínio próprio (esteticaos.com)

O endereço oficial é `https://esteticaos.com`, sem `www` — o `www` só
redireciona para ele. O domínio está registrado na Hostinger e apontado
para a Vercel.

Nenhum domínio está escrito no código: tudo sai de `NEXT_PUBLIC_SITE_URL`
(veja `src/lib/site-url.ts`). Trocar de endereço é mudar essa variável e
refazer o deploy.

1. **Vercel > Settings > Domains**: adicione `esteticaos.com` e
   `www.esteticaos.com`, deixando o `www` como redirecionamento para o
   domínio sem `www`. A Vercel mostra os registros de DNS a criar.
2. **Hostinger > DNS**: crie os registros que a Vercel indicou e remova
   os registros `A`/`CNAME` que a Hostinger cria sozinha para a página de
   parking — eles conflitam e o domínio fica intermitente.
3. **Vercel > Settings > Environment Variables**: defina
   `NEXT_PUBLIC_SITE_URL=https://esteticaos.com`, sem barra no fim.
   Variável nova só vale em build novo: faça um **redeploy**.
4. **Supabase > Authentication > URL Configuration**:
   - **Site URL**: `https://esteticaos.com` — este é o campo decisivo.
     Nos templates de e-mail ele vira o `{{ .SiteURL }}` de todo link, e
     é também para onde o Supabase joga quem tiver um destino recusado.
   - **Redirect URLs**: `https://esteticaos.com/auth/callback?**` e
     `https://esteticaos.com/auth/confirm?**`, mais as de `localhost`.
     O `?**` é obrigatório: entrada sem curinga casa com a URL inteira,
     query incluída.

Sem o passo 4 o sintoma é traiçoeiro: cadastro e login seguem
funcionando, mas todo e-mail de confirmação, convite e redefinição de
senha leva o usuário para o endereço antigo.

### Diagnóstico rápido: qual domínio o sistema acha que é o dele

Abra `https://esteticaos.com/robots.txt`. A última linha mostra o
endereço que o sistema está usando para montar tudo:

```
Sitemap: https://esteticaos.com/sitemap.xml      ← certo
Sitemap: https://estetica-os-plum.vercel.app/... ← NEXT_PUBLIC_SITE_URL não está definida
```

Se aparecer o endereço da Vercel, a variável não chegou ao build de
produção — e aí nenhum link de e-mail vai sair certo, porque
`src/lib/site-url.ts` cai no endereço interno da Vercel quando a
variável falta. Defina a variável **para o ambiente Production** e faça
um redeploy.

Confira também o sentido do redirecionamento de domínio:

```bash
curl -sI https://esteticaos.com/ | grep -i location
```

Não deve devolver nada. Se devolver `location: https://estetica-os-plum.vercel.app/`,
o domínio oficial está configurado na Vercel como *redirect* para o
endereço interno — exatamente o contrário do que deveria. Em
**Vercel > Settings > Domains**, `esteticaos.com` precisa ser o domínio
de produção, e o `www` é que redireciona para ele.

> **Arrume o sentido do redirecionamento antes de definir
> `NEXT_PUBLIC_SITE_URL`.** Com os dois errados ao mesmo tempo, a Vercel
> empurra para o endereço interno e o proxy empurra de volta, em laço. O
> código corta o laço no segundo salto (ver `CANONICAL_GUARD_COOKIE`),
> mas o sistema fica servindo no endereço errado até o painel ser
> corrigido.

### O endereço antigo da Vercel

`estetica-os-plum.vercel.app` **não é o endereço público do sistema** e
não deve gerar link novo nenhum. Ele pode ficar nas Redirect URLs por
algumas semanas, como compatibilidade para convites enviados antes da
troca de domínio — nunca na *Site URL*.

Como rede de segurança, o proxy devolve para `esteticaos.com` qualquer
requisição que chegue por outro endereço, preservando caminho e query
(`src/lib/canonical-host.ts`). Isso salva o link antigo, mas não
substitui o ajuste no painel: o e-mail que a pessoa recebe continua
mostrando o endereço errado. Deploys de *preview* são exceção e seguem
navegáveis no endereço próprio.

## E-mails (SMTP)

Configuração do envio e os textos dos três e-mails de autenticação estão
em [`docs/smtp.md`](docs/smtp.md), com os modelos prontos em
`docs/emails/`. Faça depois do domínio: o provedor só libera o envio com
o domínio já verificado.

Nenhuma chave sensível fica no código-fonte: o `.env.local` é ignorado pelo Git (`.gitignore`) e a `service_role key` só é lida em código que roda no servidor (`src/lib/supabase/admin.ts`, marcado com `server-only` — se algum dia for importada sem querer num componente de cliente, o build quebra em vez de vazar a chave).
