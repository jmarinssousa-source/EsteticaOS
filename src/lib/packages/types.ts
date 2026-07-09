export type PackageOption = {
  id: string;
  name: string;
  total_sessions: number;
  price: number;
  validity_days: number | null;
};

export type PackageBalance = {
  id: string;
  patient_id: string;
  package_id: string;
  total_sessions: number;
  used_sessions: number;
  expires_at: string | null;
};
