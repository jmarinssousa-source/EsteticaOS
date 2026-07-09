// Simplified base outlines to draw over — not anatomically precise by
// design (PRD 15.3 explicitly allows starting simple: base image, free
// drawing, save marking). Used both for on-screen rendering and, as a
// plain string, to composite into the final saved PNG — single source
// of truth so the two never drift apart.

export const FACIAL_MAP_VIEWBOX = "0 0 300 380";

export const FACIAL_MAP_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${FACIAL_MAP_VIEWBOX}" width="100%" height="100%">
  <ellipse cx="150" cy="190" rx="95" ry="130" fill="none" stroke="#9CA3AF" stroke-width="2" />
  <path d="M55 150 Q35 190 55 230" fill="none" stroke="#9CA3AF" stroke-width="2" />
  <path d="M245 150 Q265 190 245 230" fill="none" stroke="#9CA3AF" stroke-width="2" />
  <path d="M95 140 Q115 128 135 140" fill="none" stroke="#9CA3AF" stroke-width="2" />
  <path d="M165 140 Q185 128 205 140" fill="none" stroke="#9CA3AF" stroke-width="2" />
  <ellipse cx="112" cy="165" rx="20" ry="12" fill="none" stroke="#9CA3AF" stroke-width="2" />
  <ellipse cx="188" cy="165" rx="20" ry="12" fill="none" stroke="#9CA3AF" stroke-width="2" />
  <path d="M150 170 L142 225 Q150 234 158 225" fill="none" stroke="#9CA3AF" stroke-width="2" />
  <path d="M118 258 Q150 278 182 258" fill="none" stroke="#9CA3AF" stroke-width="2" />
  <path d="M150 60 Q100 70 90 140" fill="none" stroke="#9CA3AF" stroke-width="2" />
  <path d="M150 60 Q200 70 210 140" fill="none" stroke="#9CA3AF" stroke-width="2" />
</svg>
`.trim();

export const BODY_MAP_VIEWBOX = "0 0 300 520";

export const BODY_MAP_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${BODY_MAP_VIEWBOX}" width="100%" height="100%">
  <ellipse cx="150" cy="45" rx="38" ry="42" fill="none" stroke="#9CA3AF" stroke-width="2" />
  <path d="M128 82 L128 110 M172 82 L172 110" fill="none" stroke="#9CA3AF" stroke-width="2" />
  <path
    d="M110 112 Q150 96 190 112 L228 150 L206 200 L188 168 L188 320 L206 470 L176 470 L160 340
       L140 340 L124 470 L94 470 L112 320 L112 168 L94 200 L72 150 Z"
    fill="none"
    stroke="#9CA3AF"
    stroke-width="2"
  />
</svg>
`.trim();
