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
6. Rode, em ordem, o SQL de cada arquivo em `supabase/migrations/` (0001 a 0011) no **SQL Editor** do Supabase — ou via Supabase CLI, se o projeto estiver linkado. A migração `0008_prontuario.sql` cria também o bucket de Storage `patient-media` (privado); confirme em **Storage** que ele existe após rodar essa migração.
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
   - `NEXT_PUBLIC_SITE_URL` — a URL final do deploy (ex.: `https://esteticaos.vercel.app` ou o domínio próprio), usada para montar os links de confirmação de e-mail/redefinição de senha.
4. Clique em **Deploy**.
5. Depois do primeiro deploy, no Supabase em **Authentication > URL Configuration**, adicione `https://<seu-domínio>/auth/callback` às Redirect URLs (mantendo a de `localhost` para continuar testando localmente).
6. Se usar um domínio próprio na Vercel, atualize `NEXT_PUBLIC_SITE_URL` no projeto da Vercel e refaça o deploy (ou redeploy) para o valor entrar em vigor.

Nenhuma chave sensível fica no código-fonte: o `.env.local` é ignorado pelo Git (`.gitignore`) e a `service_role key` só é lida em código que roda no servidor (`src/lib/supabase/admin.ts`, marcado com `server-only` — se algum dia for importada sem querer num componente de cliente, o build quebra em vez de vazar a chave).
