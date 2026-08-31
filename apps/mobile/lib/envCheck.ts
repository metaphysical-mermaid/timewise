export function checkPublicEnv(): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!process.env.EXPO_PUBLIC_API_BASE_URL) {
    missing.push("EXPO_PUBLIC_API_BASE_URL");
  }
  if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
    missing.push("EXPO_PUBLIC_SUPABASE_URL");
  }
  if (!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    missing.push("EXPO_PUBLIC_SUPABASE_ANON_KEY");
  }
  return { ok: missing.length === 0, missing };
}
