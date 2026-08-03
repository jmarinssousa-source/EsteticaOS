/**
 * Testes de regressão das correções de segurança.
 *
 * Rodam no executor nativo do Node (`node --test`), sem framework e sem
 * dependência nova: o Node lê TypeScript direto a partir da 22.18. O que
 * está aqui é o que uma auditoria encontrou quebrado — cada teste existe
 * para que não volte a quebrar em silêncio.
 *
 * Só entram funções puras. Nada aqui toca banco, rede ou sessão.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { generateCsv } from "../src/lib/importacao/csv.ts";
import { checkPhotoFile, parseMapImageDataUrl, MAX_PHOTO_BYTES } from "../src/lib/prontuario/upload.ts";
import { buildCsp } from "../src/lib/security/csp.ts";
import { canonicalRedirect } from "../src/lib/canonical-host.ts";
import { hasPermission, DEFAULT_PERMISSIONS, PERMISSION_KEYS } from "../src/lib/auth/permissions.ts";

// ---------------------------------------------------------------------
// Exportação em CSV
// ---------------------------------------------------------------------

describe("CSV exportado não vira fórmula na planilha", () => {
  test("célula começada por = é neutralizada", () => {
    const csv = generateCsv([["nome"], ["=HYPERLINK(\"http://mau.exemplo\",\"clique\")"]]);
    assert.ok(!csv.includes("\n=HYPERLINK"), "a fórmula não pode abrir a célula");
    assert.match(csv, /"'=HYPERLINK/);
  });

  test("os outros três gatilhos de fórmula também", () => {
    for (const gatilho of ["+", "-", "@"]) {
      const csv = generateCsv([[`${gatilho}SUM(A1)`]]);
      assert.ok(csv.startsWith(`"'${gatilho}`), `${gatilho} deveria ser neutralizado`);
    }
  });

  test("texto normal continua saindo limpo", () => {
    assert.equal(generateCsv([["Mariana Costa"], ["11 98211-3344"]]), "Mariana Costa\r\n11 98211-3344");
  });

  test("aspas e vírgula continuam escapadas como antes", () => {
    assert.equal(generateCsv([['Rua "A", 10']]), '"Rua ""A"", 10"');
  });
});

// ---------------------------------------------------------------------
// Envio de foto do prontuário
// ---------------------------------------------------------------------

function arquivo(nome: string, tipo: string, bytes = 1024): File {
  return new File([new Uint8Array(bytes)], nome, { type: tipo });
}

describe("envio de foto só aceita imagem", () => {
  test("HTML disfarçado de foto é recusado", () => {
    const resultado = checkPhotoFile(arquivo("foto.jpg", "text/html"));
    assert.equal(resultado.ok, false);
  });

  test("SVG é recusado — é XML executável, não foto", () => {
    assert.equal(checkPhotoFile(arquivo("mapa.svg", "image/svg+xml")).ok, false);
  });

  test("a extensão sai da lista, nunca do nome do arquivo", () => {
    const resultado = checkPhotoFile(arquivo("foto.php.jpeg", "image/png"));
    assert.equal(resultado.ok, true);
    if (resultado.ok) {
      assert.equal(resultado.extension, "png");
      assert.equal(resultado.mimeType, "image/png");
    }
  });

  test("arquivo grande demais é recusado antes de subir", () => {
    assert.equal(checkPhotoFile(arquivo("enorme.jpg", "image/jpeg", MAX_PHOTO_BYTES + 1)).ok, false);
  });

  test("arquivo vazio é recusado", () => {
    assert.equal(checkPhotoFile(arquivo("vazia.jpg", "image/jpeg", 0)).ok, false);
  });

  test("os formatos de câmera passam", () => {
    for (const tipo of ["image/jpeg", "image/png", "image/webp", "image/heic"]) {
      assert.equal(checkPhotoFile(arquivo(`f.${tipo}`, tipo)).ok, true, tipo);
    }
  });

  test("o tipo com charset ainda é reconhecido", () => {
    assert.equal(checkPhotoFile(arquivo("f.jpg", "image/jpeg; charset=binary")).ok, true);
  });
});

describe("mapa do prontuário só aceita PNG de verdade", () => {
  const pngValido = (() => {
    const assinatura = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    return `data:image/png;base64,${Buffer.concat([assinatura, Buffer.from("resto")]).toString("base64")}`;
  })();

  test("PNG com assinatura correta passa", () => {
    assert.ok(parseMapImageDataUrl(pngValido));
  });

  test("outro tipo declarado é recusado", () => {
    assert.equal(parseMapImageDataUrl("data:text/html;base64,PHNjcmlwdD4="), null);
  });

  test("PNG declarado mas com conteúdo de outra coisa é recusado", () => {
    const falso = `data:image/png;base64,${Buffer.from("<script>alert(1)</script>").toString("base64")}`;
    assert.equal(parseMapImageDataUrl(falso), null);
  });

  test("string vazia é recusada", () => {
    assert.equal(parseMapImageDataUrl(""), null);
  });
});

// ---------------------------------------------------------------------
// Content-Security-Policy
// ---------------------------------------------------------------------

describe("CSP", () => {
  const csp = buildCsp("abc123", false, "esteticaos.com");

  test("script não aceita inline nem eval em produção", () => {
    const scriptSrc = csp.split("; ").find((d) => d.startsWith("script-src "))!;
    assert.ok(!scriptSrc.includes("'unsafe-inline'"));
    assert.ok(!scriptSrc.includes("'unsafe-eval'"));
    assert.ok(scriptSrc.includes("'nonce-abc123'"));
  });

  test("o sistema não pode ser emoldurado", () => {
    assert.ok(csp.includes("frame-ancestors 'none'"));
    assert.ok(csp.includes("object-src 'none'"));
    assert.ok(csp.includes("base-uri 'self'"));
  });

  test("formulário só posta para o próprio site", () => {
    assert.ok(csp.includes("form-action 'self'"));
  });

  test("HTTPS é forçado em domínio de verdade", () => {
    assert.ok(csp.includes("upgrade-insecure-requests"));
  });

  test("mas não em localhost, senão o build de produção não roda na máquina", () => {
    assert.ok(!buildCsp("abc", false, "localhost:3000").includes("upgrade-insecure-requests"));
  });

  test("em desenvolvimento o eval do React é liberado", () => {
    assert.ok(buildCsp("abc", true, "localhost:3000").includes("'unsafe-eval'"));
  });
});

// ---------------------------------------------------------------------
// Domínio oficial
// ---------------------------------------------------------------------

describe("redirecionamento para o domínio oficial", () => {
  const comSite = <T>(valor: string | undefined, fn: () => T): T => {
    const antes = process.env.NEXT_PUBLIC_SITE_URL;
    const antesVercel = process.env.VERCEL_ENV;
    if (valor === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = valor;
    delete process.env.VERCEL_ENV;
    try {
      return fn();
    } finally {
      if (antes === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
      else process.env.NEXT_PUBLIC_SITE_URL = antes;
      if (antesVercel !== undefined) process.env.VERCEL_ENV = antesVercel;
    }
  };

  test("caminho e query sobrevivem ao redirecionamento", () => {
    comSite("https://esteticaos.com", () => {
      const destino = canonicalRedirect(
        new URL("https://antigo.vercel.app/auth/confirm?token_hash=x&type=invite"),
        "antigo.vercel.app",
      );
      assert.equal(destino?.toString(), "https://esteticaos.com/auth/confirm?token_hash=x&type=invite");
    });
  });

  test("quem já está no domínio oficial não é mexido", () => {
    comSite("https://esteticaos.com", () => {
      assert.equal(canonicalRedirect(new URL("https://esteticaos.com/hoje"), "esteticaos.com"), null);
    });
  });

  test("sem domínio configurado não há para onde canonizar", () => {
    comSite(undefined, () => {
      assert.equal(canonicalRedirect(new URL("https://qualquer.app/hoje"), "qualquer.app"), null);
    });
  });

  test("localhost fica de fora", () => {
    comSite("https://esteticaos.com", () => {
      assert.equal(canonicalRedirect(new URL("http://localhost:3000/hoje"), "localhost:3000"), null);
    });
  });
});

// ---------------------------------------------------------------------
// Matriz de autorização
//
// Este bloco é a matriz de permissões por perfil escrita como teste. Se
// alguém afrouxar um padrão sem querer, o teste conta.
// ---------------------------------------------------------------------

describe("matriz de permissões por perfil", () => {
  const membro = (role: keyof typeof DEFAULT_PERMISSIONS) => ({ role, permissions: {} });

  test("Dono/Admin passa em tudo, independente do que estiver gravado", () => {
    for (const chave of PERMISSION_KEYS) {
      assert.equal(hasPermission({ role: "owner", permissions: { [chave]: false } }, chave), true, chave);
    }
  });

  test("Recepção não vê financeiro nem configurações", () => {
    for (const chave of [
      "finance_view",
      "finance_edit",
      "finance_revenue_view",
      "finance_commissions_view",
      "settings_access",
    ] as const) {
      assert.equal(hasPermission(membro("reception"), chave), false, chave);
    }
  });

  test("Recepção não edita prontuário, só lê", () => {
    assert.equal(hasPermission(membro("reception"), "records_view"), true);
    assert.equal(hasPermission(membro("reception"), "records_edit"), false);
  });

  test("Profissional não vê financeiro, CRM nem configurações", () => {
    for (const chave of ["finance_view", "crm_view", "settings_access", "inventory_edit"] as const) {
      assert.equal(hasPermission(membro("professional"), chave), false, chave);
    }
  });

  test("Financeiro não edita prontuário nem abre configurações", () => {
    for (const chave of ["records_view", "records_edit", "settings_access"] as const) {
      assert.equal(hasPermission(membro("finance"), chave), false, chave);
    }
  });

  test("sem membro nenhum, nada é permitido", () => {
    for (const chave of PERMISSION_KEYS) {
      assert.equal(hasPermission(null, chave), false, chave);
    }
  });

  test("a permissão gravada no usuário vence o padrão do perfil", () => {
    assert.equal(hasPermission({ role: "reception", permissions: { finance_view: true } }, "finance_view"), true);
    assert.equal(hasPermission({ role: "finance", permissions: { finance_edit: false } }, "finance_edit"), false);
  });
});
