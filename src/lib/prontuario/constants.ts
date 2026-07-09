export const MAP_TYPES = ["facial", "body"] as const;
export type MapType = (typeof MAP_TYPES)[number];

export const MAP_TYPE_LABELS: Record<MapType, string> = {
  facial: "Mapa facial",
  body: "Mapa corporal",
};

export const PHOTO_TYPES = ["before", "after", "general"] as const;
export type PhotoType = (typeof PHOTO_TYPES)[number];

export const PHOTO_TYPE_LABELS: Record<PhotoType, string> = {
  before: "Antes",
  after: "Depois",
  general: "Geral",
};

export const PATIENT_MEDIA_BUCKET = "patient-media";
