"use client";

import { addDaysLocalDate, todayLocalDate, todoInputSchema } from "@timewise/core";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type TodoRow = {
  id: string;
  title: string;
  done: boolean;
  local_date: string;
  sort_order: number;
};

export function TodosClient({
  timezone,
  initialDate,
}: {
  timezone: string;
  initialDate: string;
}) {
  const [localDate, setLocalDate] = useState(initialDate);
  const [todos, setTodos] = useState<TodoRow[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTodos = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const today = todayLocalDate(timezone);

    // Carry incomplete todos from earlier days onto today so they don't disappear overnight.
    if (localDate === today) {
      const { error: carryError } = await supabase
        .from("todos")
        .update({ local_date: today })
        .eq("done", false)
        .lt("local_date", today);
      if (carryError) {
        setError(carryError.message);
        setTodos([]);
        setLoading(false);
        return;
      }
    }

    const { data, error: fetchError } = await supabase
      .from("todos")
      .select("id, title, done, local_date, sort_order")
      .eq("local_date", localDate)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setTodos([]);
    } else {
      setTodos((data as TodoRow[]) ?? []);
    }
    setLoading(false);
  }, [localDate, timezone]);

  useEffect(() => {
    void loadTodos();
  }, [loadTodos]);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = todoInputSchema.safeParse({ title, localDate });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Invalid todo");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      setError("Sign in required");
      return;
    }

    const maxOrder = todos.reduce((max, todo) => Math.max(max, todo.sort_order), -1);
    const { error: insertError } = await supabase.from("todos").insert({
      user_id: user.id,
      title: parsed.data.title,
      local_date: parsed.data.localDate,
      sort_order: maxOrder + 1,
      done: false,
    });

    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    setTitle("");
    await loadTodos();
  }

  async function toggleDone(todo: TodoRow) {
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("todos")
      .update({ done: !todo.done })
      .eq("id", todo.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    await loadTodos();
  }

  async function deleteTodo(id: string) {
    setError(null);
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("todos").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await loadTodos();
  }

  const today = todayLocalDate(timezone);
  const remaining = todos.filter((todo) => !todo.done).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          className="app-btn-secondary !min-h-10 !w-auto px-3"
          onClick={() => setLocalDate(addDaysLocalDate(localDate, -1))}
        >
          ←
        </button>
        <div className="text-center">
          <p className="font-semibold">{localDate === today ? "Today" : localDate}</p>
          <p className="app-hint">
            {remaining} remaining · {todos.length} total
            {localDate === today ? " · undone items carry over" : ""}
          </p>
        </div>
        <button
          type="button"
          className="app-btn-secondary !min-h-10 !w-auto px-3"
          onClick={() => setLocalDate(addDaysLocalDate(localDate, 1))}
          disabled={localDate >= today}
        >
          →
        </button>
      </div>

      <form onSubmit={(e) => void handleAdd(e)} className="app-card flex flex-col gap-2">
        <label className="app-section-title" htmlFor="todo-title">
          Add a todo
        </label>
        <input
          id="todo-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing?"
          className="rounded-xl border border-[var(--line)] px-3 py-2"
          maxLength={200}
        />
        <button type="submit" className="app-btn-primary" disabled={saving || !title.trim()}>
          {saving ? "Adding…" : "Add to list"}
        </button>
      </form>

      {error ? <p className="app-error-box">{error}</p> : null}

      {loading ? (
        <p className="app-hint">Loading…</p>
      ) : todos.length === 0 ? (
        <p className="app-hint">No todos for this day yet. Add one above.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {todos.map((todo) => (
            <li key={todo.id} className="app-card flex items-start gap-3">
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => void toggleDone(todo)}
                className="mt-1 h-4 w-4 accent-[var(--accent)]"
                aria-label={`Mark ${todo.title} as ${todo.done ? "not done" : "done"}`}
              />
              <div className="min-w-0 flex-1">
                <p className={todo.done ? "text-[var(--muted)] line-through" : "font-medium"}>
                  {todo.title}
                </p>
              </div>
              <button
                type="button"
                className="text-sm text-[var(--danger)]"
                onClick={() => void deleteTodo(todo.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
