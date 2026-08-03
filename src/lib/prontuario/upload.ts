/**
 * O que pode entrar no bucket de fotos do prontuário.
 *
 * ## Por que isto existe
 *
 * O envio de foto aceitava qualquer arquivo, guardava com o tipo que o
 * navegador dissesse (`file.type`, escrito pelo cliente) e com a extensão
 * tirada do nome original. Isso deixava um caminho aberto: subir um
 * `.html` declarado como `text/html` e receber de volta uma URL assinada
 * do Supabase que o navegador abre como página. O domínio é o do
 * Supabase, não o do sistema, então os cookies de sessão não vazam — mas
 * sobra uma página com aparência confiável, hospedada na infraestrutura
 * da clínica, servindo para golpe.
 *
 * Além disso a extensão saía de `file.name.split(".").pop()`, sem
 * limpeza: um nome como `foto.jpg/../x` mexia na forma do caminho
 * guardado.
 *
 * A regra agora é a inversa da anterior: nada passa a não ser que esteja
 * na lista. O tipo é decidido aqui, pela lista, e não pelo que o cliente
 * mandou.
 */

/** Formatos de imagem que a clínica realmente usa para evolução. */
export const ALLOWED_PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export type AllowedPhotoMimeType = (typeof ALLOWED_PHOTO_MIME_TYPES)[number];

/**
 * Extensão canônica de cada tipo. Sai daqui, nunca do nome do arquivo.
 *
 * SVG está fora de propósito: é XML, pode conter script e é executado
 * pelo navegador quando aberto direto. Não é formato de foto de câmera.
 */
const EXTENSION_BY_MIME: Record<AllowedPhotoMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

/**
 * Teto por arquivo: 15 MB.
 *
 * Foto de celular moderno fica entre 2 e 8 MB, então o limite cabe com
 * folga. O teto total da requisição é o `bodySizeLimit` do
 * `next.config.ts`; este aqui recusa o arquivo isolado antes de gastar
 * banda subindo para o Storage.
 */
export const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

/** Teto do PNG do mapa corporal desenhado no canvas. */
export const MAX_MAP_IMAGE_BYTES = 5 * 1024 * 1024;

export type PhotoCheck =
  | { ok: true; mimeType: AllowedPhotoMimeType; extension: string }
  | { ok: false; error: string };

/**
 * Confere um arquivo enviado pela tela de fotos.
 *
 * Só o tipo declarado é consultado, e ele é confrontado com a lista. Uma
 * verificação de assinatura binária (magic bytes) seria mais forte, mas
 * não é o que separa risco de não-risco aqui: o que impedia o abuso era
 * o arquivo ser servido como HTML, e isso quem decide é o tipo que
 * gravamos — que agora sai da lista, não do cliente.
 */
export function checkPhotoFile(file: File): PhotoCheck {
  if (file.size === 0) {
    return { ok: false, error: `"${file.name}" está vazio.` };
  }

  if (file.size > MAX_PHOTO_BYTES) {
    return {
      ok: false,
      error: `"${file.name}" passa de ${Math.floor(MAX_PHOTO_BYTES / (1024 * 1024))} MB. Reduza a foto e tente de novo.`,
    };
  }

  const declared = file.type.toLowerCase().split(";")[0].trim();

  if (!(ALLOWED_PHOTO_MIME_TYPES as readonly string[]).includes(declared)) {
    return {
      ok: false,
      error: `"${file.name}" não é uma foto em formato aceito. Use JPG, PNG, WEBP ou HEIC.`,
    };
  }

  const mimeType = declared as AllowedPhotoMimeType;
  return { ok: true, mimeType, extension: EXTENSION_BY_MIME[mimeType] };
}

/**
 * Converte o PNG do mapa corporal, que chega como data URL do canvas.
 *
 * Devolve `null` quando o conteúdo não é um PNG em base64 — o desenho
 * sai de um `<canvas>` do próprio sistema, então qualquer outra coisa
 * chegando aqui é requisição forjada, não uso normal.
 */
export function parseMapImageDataUrl(dataUrl: string): Buffer | null {
  const prefix = "data:image/png;base64,";
  if (!dataUrl.startsWith(prefix)) return null;

  const base64 = dataUrl.slice(prefix.length);
  if (!base64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) return null;

  const buffer = Buffer.from(base64, "base64");
  if (buffer.length === 0 || buffer.length > MAX_MAP_IMAGE_BYTES) return null;

  // Assinatura do PNG. Barato de conferir e fecha a porta para um
  // conteúdo qualquer ser guardado como se fosse imagem.
  const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) return null;

  return buffer;
}
