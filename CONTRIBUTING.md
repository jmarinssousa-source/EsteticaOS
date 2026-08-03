# Como contribuir

O EstéticaOS é um produto em operação, com clínicas usando e dado de
paciente dentro. Isso muda o que se espera de uma contribuição: não basta
funcionar, precisa não quebrar quem já depende do sistema.

## Antes de começar

Leia o [`AGENTS.md`](AGENTS.md). Ele diz uma coisa importante e fácil de
ignorar: **esta versão do Next.js tem mudanças incompatíveis com o que
você provavelmente conhece.** Antes de escrever código de framework,
consulte o guia correspondente em `node_modules/next/dist/docs/`. Não
presuma API por memória — o arquivo `middleware.ts`, por exemplo, aqui se
chama `proxy.ts`.

Se for mexer em autenticação, permissão ou banco, leia também
[`docs/seguranca.md`](docs/seguranca.md).

## Rodando na sua máquina

```bash
npm install
cp .env.local.example .env.local   # e preencha
npm run dev
```

As migrações em `supabase/migrations/` rodam em ordem, no SQL Editor do
Supabase. Rode todas, na sequência, num projeto novo.

## Antes de abrir a PR

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Os quatro precisam passar. A CI roda os mesmos comandos, então descobrir
aqui economiza uma viagem.

Os testes usam o executor nativo do Node e pedem **Node 22.18 ou mais
novo** (é a versão a partir da qual o Node lê TypeScript direto). A
aplicação em si roda a partir da 20.9.

## O que não entra numa PR

- **Segredo.** Chave, token, senha, string de conexão. Nem em exemplo,
  nem em comentário, nem em teste. O `.gitignore` cobre `.env*`, mas ele
  não protege contra o que for colado direto num arquivo de código.
- **Dado real de paciente.** Nem em seed, nem em fixture, nem em captura
  de tela, nem em issue. Este repositório é público.
- **Dependência sem motivo.** Cada pacote novo é código de terceiro
  rodando no mesmo processo que lê prontuário. Se dá para escrever em
  trinta linhas, escreva as trinta linhas — é a razão de o projeto gerar
  o próprio XLSX e o próprio CSV.

## Migrações

- Numeração sequencial, sem pular: `0021_...`, `0022_...`.
- `if not exists` / `if exists` sempre que der, para a migração poder ser
  rodada de novo sem quebrar.
- Toda tabela nova de dado nasce com RLS ligada e com policy amarrada em
  `current_clinic_member()`. Tabela sem RLS num banco multi-clínica é
  vazamento esperando acontecer.
- Explique no cabeçalho do arquivo **por que** a mudança existe, não só o
  que ela faz. O "o quê" o SQL já conta.

## Sobre os comentários no código

Este repositório comenta bastante, e o padrão tem uma regra: comentário
explica **decisão**, não mecânica. `// incrementa i` não ajuda ninguém.
`// service role aqui porque o RLS filtra em silêncio e a promoção
parecia dar certo sem ter mudado nada` evita que a próxima pessoa desfaça
a correção achando que era exagero.

Escreva em português, como o resto do projeto.

## Mensagens de commit

Em português, no imperativo, dizendo o efeito para quem usa:

```
Convite só abre o painel depois da senha criada
Cortar o laço quando a Vercel redireciona no sentido contrário
```

Não:

```
fix bug
ajustes
wip
```

## Encontrou uma falha de segurança?

Não abra issue. Siga a [política de segurança](SECURITY.md).
