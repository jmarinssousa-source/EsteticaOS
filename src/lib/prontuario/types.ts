import type { MapType, PhotoType } from "@/lib/prontuario/constants";

export type PatientRecord = {
  id: string;
  patient_id: string;
  professional_id: string | null;
  procedure_id: string | null;
  record_date: string;
  notes: string | null;
  map_type: MapType | null;
  map_image_path: string | null;
  complication: string | null;
  created_at: string;
};

export type PatientPhoto = {
  id: string;
  patient_id: string;
  record_id: string | null;
  storage_path: string;
  label: string | null;
  photo_type: PhotoType;
  created_at: string;
};
