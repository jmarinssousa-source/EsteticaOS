export const MAP_TYPES = ["facial", "body"] as const;
export type MapType = (typeof MAP_TYPES)[number];

export const MAP_TYPE_LABELS: Record<MapType, string> = {
  facial: "Mapa facial",
  body: "Mapa corporal",
};

// Only relevant when mapType === "body" — the facial map has a single view.
export const BODY_VIEWS = ["front", "back"] as const;
export type BodyView = (typeof BODY_VIEWS)[number];

export const BODY_VIEW_LABELS: Record<BodyView, string> = {
  front: "Frente",
  back: "Costas",
};

export const GENDERS = ["female", "male"] as const;
export type Gender = (typeof GENDERS)[number];

export const GENDER_LABELS: Record<Gender, string> = {
  female: "Mulher",
  male: "Homem",
};

export const PHOTO_TYPES = ["before", "after", "general"] as const;
export type PhotoType = (typeof PHOTO_TYPES)[number];

export const PHOTO_TYPE_LABELS: Record<PhotoType, string> = {
  before: "Antes",
  after: "Depois",
  general: "Geral",
};

export const PATIENT_MEDIA_BUCKET = "patient-media";
