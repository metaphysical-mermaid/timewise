import Constants from "expo-constants";

type Extra = {
  apiBaseUrl?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

function extra(): Extra {
  return (Constants.expoConfig?.extra ?? {}) as Extra;
}

export function getApiBaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_BASE_URL ?? extra().apiBaseUrl;
  if (!url) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL is not set");
  }
  return url.replace(/\/$/, "");
}

export function getSupabaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra().supabaseUrl;
  if (!url) {
    throw new Error("EXPO_PUBLIC_SUPABASE_URL is not set");
  }
  return url;
}

export function getSupabaseAnonKey(): string {
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra().supabaseAnonKey;
  if (!key) {
    throw new Error("EXPO_PUBLIC_SUPABASE_ANON_KEY is not set");
  }
  return key;
}
