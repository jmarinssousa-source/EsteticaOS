# EstéticaOS

SaaS de gestão visual para clínicas de estética. Stack: Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui, com Supabase (Postgres, Auth, RLS multi-clínica).

## Fase 1 — Fundação do SaaS

Escopo implementado: cadastro de clínica com verificação de e-mail, login, recuperação de senha, estrutura multi-clínica, perfis e permissões granulares, layout base com menu principal.

## Configuração

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **Project Settings > API**, copie a URL, a `anon key` e a `service_role key`.
3. Copie `.env.local.example` para `.env.local` e preencha os três valores.
4. Em **Authentication > URL Configuration**, adicione `http://localhost:3000/auth/callback` (e a URL de produção, quando houver) às Redirect URLs.
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
   - **Site URL**: `https://esteticaos.com`
   - **Redirect URLs**: acrescente `https://esteticaos.com/auth/callback`

   Mantenha na lista a URL antiga da Vercel e a de `localhost`. Se
   removê-las, os links de redefinição de senha já enviados param de
   funcionar e o ambiente local deixa de autenticar.

Sem o passo 4 o sintoma é traiçoeiro: cadastro e login seguem
funcionando, mas todo e-mail de confirmação, convite e redefinição de
senha leva o usuário para o endereço antigo.

Nenhuma chave sensível fica no código-fonte: o `.env.local` é ignorado pelo Git (`.gitignore`) e a `service_role key` só é lida em código que roda no servidor (`src/lib/supabase/admin.ts`, marcado com `server-only` — se algum dia for importada sem querer num componente de cliente, o build quebra em vez de vazar a chave).
