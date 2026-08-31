"use client";

import { categoryInputSchema, type Category } from "@timewise/core";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export function SettingsClient({
  initialTimezone,
  categories: initialCategories,
}: {
  initialTimezone: string;
  categories: Category[];
}) {
  const [timezone, setTimezone] = useState(initialTimezone);
  const [categories, setCategories] = useState(initialCategories);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#2563eb");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reloadCategories = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });
    if (data) {
      setCategories(
        data.map((row) => ({
          id: row.id,
          userId: row.user_id,
          name: row.name,
          color: row.color,
          sortOrder: row.sort_order,
          isDefault: row.is_default,
          createdAt: row.created_at,
        })),
      );
    }
  }, []);

  useEffect(() => {
    setTimezone(initialTimezone);
    setCategories(initialCategories);
  }, [initialTimezone, initialCategories]);

  async function saveTimezone() {
    setError(null);
    setMessage(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ timezone })
      .eq("user_id", user.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setMessage("Timezone saved.");
  }

  async function addCategory(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const parsed = categoryInputSchema.safeParse({
      name: newName,
      color: newColor,
    });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Invalid category");
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const maxOrder = categories.reduce((m, c) => Math.max(m, c.sortOrder), -1);
    const { error: insertError } = await supabase.from("categories").insert({
      user_id: user.id,
      name: parsed.data.name,
      color: parsed.data.color,
      sort_order: maxOrder + 1,
      is_default: false,
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setNewName("");
    setMessage("Category added.");
    await reloadCategories();
  }

  async function deleteCategory(id: string, isDefault: boolean) {
    if (isDefault) {
      setError("Default categories cannot be deleted.");
      return;
    }
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("categories").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await reloadCategories();
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="app-card flex flex-col gap-3">
        <h2 className="app-section-title">Timezone</h2>
        <p className="app-hint">Used for &quot;today&quot; and weekday/weekend grouping.</p>
        <input
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="rounded-xl border border-[var(--line)] px-3 py-2"
          placeholder="America/Los_Angeles"
        />
        <button type="button" className="app-btn-secondary" onClick={() => void saveTimezone()}>
          Save timezone
        </button>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="app-section-title">Categories</h2>
        {categories.map((cat) => (
          <div key={cat.id} className="app-card flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span>{cat.name}</span>
              {cat.isDefault ? (
                <span className="text-xs text-[var(--muted)]">default</span>
              ) : null}
            </div>
            {!cat.isDefault ? (
              <button
                type="button"
                className="text-sm text-[var(--danger)]"
                onClick={() => void deleteCategory(cat.id, cat.isDefault)}
              >
                Delete
              </button>
            ) : null}
          </div>
        ))}

        <form onSubmit={(e) => void addCategory(e)} className="app-card flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Add category</h3>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
            className="rounded-xl border border-[var(--line)] px-3 py-2"
          />
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="h-10 w-full"
          />
          <button type="submit" className="app-btn-secondary">Add</button>
        </form>
      </section>

      <form action="/auth/signout" method="post">
        <button type="submit" className="app-btn-secondary">Sign out</button>
      </form>

      {message ? <p className="app-info-box">{message}</p> : null}
      {error ? <p className="app-error-box">{error}</p> : null}
    </div>
  );
}
