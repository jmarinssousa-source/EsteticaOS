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
6. Rode, em ordem, o SQL de cada arquivo em `supabase/migrations/` (0001 a 0010) no **SQL Editor** do Supabase — ou via Supabase CLI, se o projeto estiver linkado. A migração `0008_prontuario.sql` cria também o bucket de Storage `patient-media` (privado); confirme em **Storage** que ele existe após rodar essa migração.
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
