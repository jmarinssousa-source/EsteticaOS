# Política de segurança

O EstéticaOS guarda dado de saúde: prontuário, foto de evolução, anamnese
e termo de consentimento de pacientes de clínicas de estética. Falha de
segurança aqui não é incômodo, é dado de paciente exposto. Por isso este
documento existe e por isso ele é curto: para ser lido.

## Como relatar uma falha

> ⚠️ **Falta confirmar o endereço.** O contato abaixo é a sugestão; ele
> só vale depois que a caixa existir de verdade no domínio. Endereço de
> segurança que devolve "usuário inexistente" é pior que endereço
> nenhum — quem encontra a falha desiste ou publica.

Escreva para **seguranca@esteticaos.com** com:

- o que você encontrou, em uma frase;
- os passos para reproduzir;
- o que dá para fazer com a falha (o impacto);
- se possível, uma sugestão de correção.

**Não abra issue pública** para falha de segurança. Issue é aberta a
qualquer pessoa, e um relato público antes da correção transforma o
aviso em instrução de ataque.

Se você não tiver resposta em **5 dias úteis**, escreva de novo — pode
ter caído em spam.

## O que esperar

| Etapa | Prazo |
| --- | --- |
| Confirmação de que o relato chegou | 5 dias úteis |
| Avaliação inicial e classificação de severidade | 10 dias úteis |
| Correção de falha crítica ou alta | o quanto antes, com aviso de andamento |
| Aviso de que foi corrigido | assim que estiver no ar |

Se você quiser, seu nome entra no agradecimento quando a correção for
publicada. Se preferir anonimato, também está tudo bem.

## Divulgação responsável

Pedimos que você:

- dê tempo para a correção sair antes de publicar qualquer coisa;
- não acesse, altere nem baixe dado de nenhuma clínica ou paciente real —
  se topar com dado de verdade durante o teste, pare e conte no relato;
- não rode ataque de negação de serviço, força bruta em massa nem envio
  de spam contra o sistema;
- não use engenharia social com clientes, funcionários ou fornecedores.

Cumprindo isso, não tomaremos nenhuma medida legal contra você por causa
da pesquisa.

## Escopo

**Dentro do escopo:**

- `esteticaos.com` e subdomínios do sistema;
- o código deste repositório;
- as configurações de banco e políticas de acesso em `supabase/migrations/`.

**Fora do escopo:**

- serviços de terceiros (Supabase, Vercel, Cakto, Resend) — relate
  diretamente a eles;
- ataques que dependem de acesso físico à máquina de alguém;
- falhas que exigem que a vítima já esteja com o navegador comprometido;
- ausência de cabeçalhos em domínios que não servem o sistema;
- relatórios automáticos de scanner sem prova de impacto.

## Versões suportadas

O EstéticaOS é um serviço hospedado, com uma versão só: a que está no ar.
Correção de segurança é aplicada nessa versão. Não há versão antiga
mantida em paralelo.

## O que já é sabido

Riscos conhecidos e assumidos, com decisão registrada, ficam em
[`docs/seguranca.md`](docs/seguranca.md). Vale a leitura antes de
relatar — pode ser que já esteja lá, com o motivo.
