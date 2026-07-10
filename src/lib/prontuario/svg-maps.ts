// Illustrated base figures to draw over. Flat, colored, front/back ×
// female/male body silhouettes plus a generic (unisex) facial bust — not
// anatomically precise by design (PRD 15.3 explicitly allows starting
// simple: base image, free drawing, save marking), but colored and defined
// enough to look professional in a clinic tool. Used both for on-screen
// rendering and, as a plain string, to composite into the final saved PNG —
// single source of truth so the two never drift apart.
//
// Body maps come in four variants (front/back × female/male) so a
// professional can mark a procedure on the correct side of the body —
// important for treatments done on the back (e.g. glúteo/harmonização
// glútea) as much as the front. The facial map stays gender-neutral since
// facial procedures aren't marked differently by sex.

const SKIN = "#f2c9a0";
const SKIN_SHADE = "#e6b078";
const OUTLINE = "#a9713f";
const LANDMARK = "#8a5a34";
const HAIR_FEMALE = "#4a3323";
const GARMENT = "#d98a8f";
const GARMENT_STROKE = "#b5636b";
const LIPS = "#c4726c";
const EYE_IRIS = "#3d2b1f";

const SKIN_FILL = `fill="${SKIN}" stroke="${OUTLINE}" stroke-width="2" stroke-linejoin="round"`;
const LANDMARK_LINE = `fill="none" stroke="${LANDMARK}" stroke-width="1.5" opacity="0.55" stroke-linecap="round"`;
const GARMENT_FILL = `fill="${GARMENT}" stroke="${GARMENT_STROKE}" stroke-width="1.5" stroke-linejoin="round"`;

export const FACIAL_MAP_VIEWBOX = "0 0 300 380";

// Head outline: temples narrower than cheekbones, tapering to a defined
// chin — a face-shaped path instead of a plain oval, for a more human read.
const FACE_OUTLINE =
  "M150,58 C192,58 226,94 226,135 C234,160 238,178 238,196 C238,230 227,258 207,274 " +
  "C187,296 169,317 150,317 C131,317 113,296 93,274 C73,258 62,230 62,196 " +
  "C62,178 66,160 74,135 C74,94 108,58 150,58 Z";

export const FACIAL_MAP_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${FACIAL_MAP_VIEWBOX}" width="100%" height="100%">
  <ellipse cx="58" cy="192" rx="13" ry="23" ${SKIN_FILL} />
  <ellipse cx="242" cy="192" rx="13" ry="23" ${SKIN_FILL} />
  <path d="${FACE_OUTLINE}" ${SKIN_FILL} />
  <path d="M55,155 Q60,58 150,48 Q240,58 245,155 Q225,92 150,82 Q75,92 55,155 Z" fill="${HAIR_FEMALE}" opacity="0.8" />
  <path d="M78,205 Q112,222 150,222 Q188,222 222,205" fill="none" stroke="${SKIN_SHADE}" stroke-width="10" opacity="0.4" stroke-linecap="round" />
  <path d="M95 140 Q115 128 135 140" fill="none" stroke="${HAIR_FEMALE}" stroke-width="4" stroke-linecap="round" />
  <path d="M165 140 Q185 128 205 140" fill="none" stroke="${HAIR_FEMALE}" stroke-width="4" stroke-linecap="round" />
  <ellipse cx="112" cy="168" rx="19" ry="11" fill="#ffffff" stroke="${OUTLINE}" stroke-width="1.5" />
  <ellipse cx="188" cy="168" rx="19" ry="11" fill="#ffffff" stroke="${OUTLINE}" stroke-width="1.5" />
  <circle cx="114" cy="169" r="6" fill="${EYE_IRIS}" />
  <circle cx="186" cy="169" r="6" fill="${EYE_IRIS}" />
  <path d="M150 172 Q140 205 138 222 Q138 232 150 234 Q162 232 162 222" fill="none" stroke="${OUTLINE}" stroke-width="2" opacity="0.6" stroke-linecap="round" />
  <path d="M120,258 Q150,268 180,258 Q150,290 120,258 Z" fill="${LIPS}" stroke="${OUTLINE}" stroke-width="1" />
  <path d="M150,296 Q140,304 150,310 Q160,304 150,296" fill="none" stroke="${OUTLINE}" stroke-width="1.5" opacity="0.4" />
</svg>
`.trim();

export const BODY_MAP_VIEWBOX = "0 0 300 560";

function bodySvg(inner: string) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${BODY_MAP_VIEWBOX}" width="100%" height="100%">
${inner}
</svg>
`.trim();
}

const FEMALE_HAIR = `
  <path d="M118,28 C98,42 92,78 100,118 C104,100 110,88 116,80 C110,58 114,36 130,20 Z" fill="${HAIR_FEMALE}" />
  <path d="M182,28 C202,42 208,78 200,118 C196,100 190,88 184,80 C190,58 186,36 170,20 Z" fill="${HAIR_FEMALE}" />
  <path d="M118,28 Q150,2 182,28 Q150,18 118,28 Z" fill="${HAIR_FEMALE}" />`;

const FEMALE_BODY = `
  <ellipse cx="150" cy="50" rx="30" ry="36" ${SKIN_FILL} />
  <path d="M136,82 L164,82 L166,104 L134,104 Z" ${SKIN_FILL} />
  <path d="M95,104 C80,142 98,172 112,192 C100,216 88,240 92,260 L208,260 C212,240 200,216 188,192 C202,172 220,142 205,104 Z" ${SKIN_FILL} />
  <path d="M205,104 C218,140 226,170 222,190 C226,220 222,250 215,270 L204,268 C210,240 210,210 206,188 C202,160 196,138 190,106 Z" ${SKIN_FILL} />
  <path d="M95,104 C82,140 74,170 78,190 C74,220 78,250 85,270 L96,268 C90,240 90,210 94,188 C98,160 104,138 110,106 Z" ${SKIN_FILL} />
  <ellipse cx="218" cy="280" rx="10" ry="14" ${SKIN_FILL} />
  <ellipse cx="82" cy="280" rx="10" ry="14" ${SKIN_FILL} />
  <path d="M208,260 C204,320 200,360 196,390 C192,440 190,480 188,520 L172,520 C170,480 168,440 168,390 C166,360 162,320 158,260 Z" ${SKIN_FILL} />
  <path d="M92,260 C96,320 100,360 104,390 C108,440 110,480 112,520 L128,520 C130,480 132,440 132,390 C134,360 138,320 142,260 Z" ${SKIN_FILL} />
  <ellipse cx="180" cy="528" rx="18" ry="9" ${SKIN_FILL} />
  <ellipse cx="120" cy="528" rx="18" ry="9" ${SKIN_FILL} />`;

const FEMALE_FRONT_EXTRA = `
  <ellipse cx="124" cy="142" rx="26" ry="22" fill="${SKIN_SHADE}" opacity="0.4" />
  <ellipse cx="176" cy="142" rx="26" ry="22" fill="${SKIN_SHADE}" opacity="0.4" />
  <path d="M100,148 Q124,168 149,152" ${LANDMARK_LINE} />
  <path d="M151,152 Q176,168 200,148" ${LANDMARK_LINE} />
  <path d="M150,166 L150,200" ${LANDMARK_LINE} />
  <circle cx="150" cy="235" r="3" fill="${OUTLINE}" />
  <path d="M95,255 Q150,240 205,255 Q214,282 196,300 Q150,312 104,300 Q86,282 95,255 Z" ${GARMENT_FILL} />`;

const FEMALE_BACK_EXTRA = `
  <path d="M150,104 C148,150 152,200 150,260" ${LANDMARK_LINE} />
  <path d="M122,142 Q110,162 122,182" ${LANDMARK_LINE} />
  <path d="M178,142 Q190,162 178,182" ${LANDMARK_LINE} />
  <path d="M150,262 L150,320" ${LANDMARK_LINE} />
  <path d="M122,268 Q108,300 124,332" ${LANDMARK_LINE} />
  <path d="M178,268 Q192,300 176,332" ${LANDMARK_LINE} />
  <path d="M95,255 Q150,240 205,255 Q214,282 196,300 Q150,312 104,300 Q86,282 95,255 Z" ${GARMENT_FILL} />`;

const MALE_BODY = `
  <ellipse cx="150" cy="50" rx="32" ry="36" ${SKIN_FILL} />
  <path d="M132,82 L168,82 L170,106 L130,106 Z" ${SKIN_FILL} />
  <path d="M88,106 C76,148 92,180 100,192 C96,224 100,250 104,262 L196,262 C200,250 204,224 200,192 C208,180 224,148 212,106 Z" ${SKIN_FILL} />
  <path d="M212,106 C226,142 234,175 230,196 C234,228 230,258 222,280 L210,278 C216,250 216,218 212,196 C208,168 202,144 196,108 Z" ${SKIN_FILL} />
  <path d="M88,106 C74,142 66,175 70,196 C66,228 70,258 78,280 L90,278 C84,250 84,218 88,196 C92,168 98,144 104,108 Z" ${SKIN_FILL} />
  <ellipse cx="226" cy="288" rx="11" ry="15" ${SKIN_FILL} />
  <ellipse cx="74" cy="288" rx="11" ry="15" ${SKIN_FILL} />
  <path d="M196,262 C200,322 196,362 192,392 C188,442 186,482 184,522 L170,522 C168,482 166,442 166,392 C164,362 160,322 156,262 Z" ${SKIN_FILL} />
  <path d="M104,262 C100,322 104,362 108,392 C112,442 114,482 116,522 L130,522 C132,482 134,442 134,392 C136,362 140,322 144,262 Z" ${SKIN_FILL} />
  <ellipse cx="177" cy="530" rx="19" ry="9" ${SKIN_FILL} />
  <ellipse cx="123" cy="530" rx="19" ry="9" ${SKIN_FILL} />`;

const MALE_FRONT_EXTRA = `
  <path d="M150,110 L150,205" ${LANDMARK_LINE} />
  <path d="M118,155 Q150,172 182,155" ${LANDMARK_LINE} />
  <circle cx="150" cy="238" r="3" fill="${OUTLINE}" />
  <path d="M98,258 Q150,244 202,258 Q210,282 194,298 Q150,310 106,298 Q90,282 98,258 Z" ${GARMENT_FILL} />`;

const MALE_BACK_EXTRA = `
  <path d="M150,106 C148,150 152,205 150,262" ${LANDMARK_LINE} />
  <path d="M115,145 Q100,168 115,190" ${LANDMARK_LINE} />
  <path d="M185,145 Q200,168 185,190" ${LANDMARK_LINE} />
  <path d="M150,264 L150,325" ${LANDMARK_LINE} />
  <path d="M115,270 Q98,305 118,336" ${LANDMARK_LINE} />
  <path d="M185,270 Q202,305 182,336" ${LANDMARK_LINE} />
  <path d="M98,258 Q150,244 202,258 Q210,282 194,298 Q150,310 106,298 Q90,282 98,258 Z" ${GARMENT_FILL} />`;

export const BODY_FRONT_FEMALE_SVG = bodySvg(FEMALE_BODY + FEMALE_FRONT_EXTRA + FEMALE_HAIR);
export const BODY_BACK_FEMALE_SVG = bodySvg(FEMALE_BODY + FEMALE_BACK_EXTRA + FEMALE_HAIR);
export const BODY_FRONT_MALE_SVG = bodySvg(MALE_BODY + MALE_FRONT_EXTRA);
export const BODY_BACK_MALE_SVG = bodySvg(MALE_BODY + MALE_BACK_EXTRA);

// Kept for any code still expecting a single generic body map (default to
// front/female — call sites should prefer selecting a variant explicitly).
export const BODY_MAP_SVG = BODY_FRONT_FEMALE_SVG;
