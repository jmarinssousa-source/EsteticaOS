# Marca do EstéticaOS

Arquivos gerados a partir do desenho que o próprio sistema usa
(`src/app/icon.svg` e `src/components/brand/Logo.tsx`), com as mesmas
cores e a mesma fonte da aplicação. Fundo transparente em todos.

| Arquivo | O que é | Onde usar |
| --- | --- | --- |
| `marca.svg` | Só o símbolo, vetor | Qualquer tamanho, impressão, quando alguém pedir "o arquivo original" |
| `marca.png` | Só o símbolo, 512px | Foto de perfil, favicon, avatar de rede social |
| `logo-fundo-claro.png` | Símbolo e nome, 998px | Fundo branco ou claro |
| `logo-fundo-claro@2x.png` | O mesmo, 1996px | Impressão, banner, tela grande |
| `logo-fundo-escuro.png` | Símbolo e nome, 998px | Fundo escuro |

Vetor escala sem perder nitidez; PNG não. Se for imprimir grande ou
mandar para um designer, use o `.svg`.

## Cores

| Onde | Valor |
| --- | --- |
| Degradê do símbolo | `#c98a63` a `#a35a3a` |
| Pétalas | `#fffaf4` a `#f7e8dc` |
| Brilho | `#f2d09b` |
| "OS" no fundo claro | `oklch(0.56 0.12 35)` |
| "OS" no fundo escuro | `oklch(0.72 0.11 35)` |

Fonte do nome: **Fraunces**, peso 600. É a mesma dos títulos do sistema.

## Para gerar de novo

O desenho vive no código, não aqui. Mudou a marca em
`src/components/brand/Logo.tsx`? Replique em `src/app/icon.svg` e refaça
estes arquivos, senão o material de divulgação passa a mostrar uma marca
que o sistema não usa mais.
