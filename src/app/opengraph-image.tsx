import { ImageResponse } from "next/og";

/**
 * Imagem de pré-visualização dos links (WhatsApp, redes, e-mail). Sem
 * ela o WhatsApp cai no ícone genérico da hospedagem — é o "logotipo da
 * Vercel" que aparecia ao mandar a anamnese para o paciente.
 *
 * O desenho acompanha src/app/icon.svg e src/components/brand/Logo.tsx.
 */
export const alt = "EstéticaOS — gestão para clínicas de estética";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const LOTUS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="240" height="240">
  <defs>
    <linearGradient id="petal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fffaf4" />
      <stop offset="1" stop-color="#f7e8dc" />
    </linearGradient>
  </defs>
  <path d="M16 25.5 C 11.5 19.5, 12 13.5, 16 9 C 20 13.5, 20.5 19.5, 16 25.5 Z" fill="url(#petal)" opacity="0.55" transform="rotate(-42 16 25.5)" />
  <path d="M16 25.5 C 11.5 19.5, 12 13.5, 16 9 C 20 13.5, 20.5 19.5, 16 25.5 Z" fill="url(#petal)" opacity="0.55" transform="rotate(42 16 25.5)" />
  <path d="M16 25.5 C 11.5 19.5, 12 13.5, 16 9 C 20 13.5, 20.5 19.5, 16 25.5 Z" fill="url(#petal)" />
  <path d="M24.6 4.6 C 25 6.6, 25.9 7.5, 27.9 7.9 C 25.9 8.3, 25 9.2, 24.6 11.2 C 24.2 9.2, 23.3 8.3, 21.3 7.9 C 23.3 7.5, 24.2 6.6, 24.6 4.6 Z" fill="#f2d09b" />
</svg>`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          backgroundImage: "linear-gradient(135deg, #c98a63 0%, #a35a3a 100%)",
          color: "#fffaf4",
          fontSize: 40,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          width={240}
          height={240}
          src={`data:image/svg+xml;utf8,${encodeURIComponent(LOTUS)}`}
        />
        <div style={{ display: "flex", fontSize: 84, fontWeight: 700, letterSpacing: -2 }}>
          EstéticaOS
        </div>
        <div style={{ display: "flex", fontSize: 34, opacity: 0.85 }}>
          Gestão completa para clínicas de estética
        </div>
        <div style={{ display: "flex", fontSize: 22, opacity: 0.7, marginTop: 16 }}>
          Uma solução Orbyniq
        </div>
      </div>
    ),
    size,
  );
}
