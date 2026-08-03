## O que muda

<!-- Uma frase. O que a pessoa que usa o sistema vai notar de diferente. -->

## Por quê

<!-- O problema que isto resolve. Se veio de um relato, cole o essencial. -->

## Como testar

<!-- Passo a passo para quem for revisar reproduzir o resultado. -->

1.
2.

## Segurança e dados

Marque o que se aplica — e se marcar algum, explique embaixo.

- [ ] Mexe em autenticação, sessão, permissão ou perfil de acesso
- [ ] Mexe em RLS, migração ou qualquer coisa em `supabase/`
- [ ] Toca dado de paciente (prontuário, foto, anamnese, termo)
- [ ] Toca dinheiro (orçamento, venda, pagamento, comissão, assinatura)
- [ ] Adiciona dependência nova
- [ ] Precisa de variável de ambiente nova ou mudança em painel externo

<!-- Explicação, quando houver marcação acima: -->

## Antes de pedir revisão

- [ ] `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` passam
- [ ] Nenhum segredo, chave, token ou dado real de paciente no diff
- [ ] Migração nova, se houver, roda em banco limpo e em banco já existente
- [ ] O comportamento antigo continua funcionando (ou a mudança está explicada acima)
