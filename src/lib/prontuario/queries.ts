import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { PATIENT_MEDIA_BUCKET } from "@/lib/prontuario/constants";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** Signed URLs, not public ones — patient photos and marked maps stay
 * private per PRD 11.4 (proteção de fotos/prontuário). */
export async function getSignedMediaUrls(
  supabase: SupabaseServerClient,
  paths: string[],
): Promise<Record<string, string>> {
  const uniquePaths = [...new Set(paths)].filter(Boolean);
  if (uniquePaths.length === 0) return {};

  const { data } = await supabase.storage.from(PATIENT_MEDIA_BUCKET).createSignedUrls(uniquePaths, 3600);

  const map: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
  }
  return map;
}
