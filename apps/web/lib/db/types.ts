import type { Category } from "@timewise/core";
import type { SupabaseClient } from "@supabase/supabase-js";

export type DbCategory = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  sort_order: number;
  is_default: boolean;
  created_at: string;
};

export type DbTimeEntry = {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  started_at: string;
  ended_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  categories?: { name: string; color: string } | null;
};

export function mapCategory(row: DbCategory): Category {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    color: row.color,
    sortOrder: row.sort_order,
    isDefault: row.is_default,
    createdAt: row.created_at,
  };
}

export async function loadProfileTimezone(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data } = await supabase.from("profiles").select("timezone").eq("user_id", userId).single();
  return data?.timezone ?? "UTC";
}

export async function listCategories(supabase: SupabaseClient, userId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }
  return (data as DbCategory[]).map(mapCategory);
}
