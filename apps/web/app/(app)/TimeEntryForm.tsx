"use client";

import { timeEntryInputSchema, type Category } from "@timewise/core";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DbTimeEntry } from "@/lib/db/types";

type EntryRow = DbTimeEntry & {
  categories?: { name: string; color: string } | null;
};

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function addOneHourLocal(localDatetime: string): string {
  const date = new Date(localDatetime);
  date.setHours(date.getHours() + 1);
  return toLocalInputValue(date.toISOString());
}

export function TimeEntryForm({
  categories,
  localDate,
  entry,
  previousEndedAt,
  onCancel,
  onSaved,
}: {
  categories: Category[];
  localDate: string;
  entry: EntryRow | null;
  /** ISO end time of the previous entry; new entries start here. */
  previousEndedAt?: string | null;
  onCancel: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const defaultStart = entry
    ? toLocalInputValue(entry.started_at)
    : previousEndedAt
      ? toLocalInputValue(previousEndedAt)
      : `${localDate}T09:00`;
  const defaultEnd = entry
    ? toLocalInputValue(entry.ended_at)
    : addOneHourLocal(defaultStart);

  const [title, setTitle] = useState(entry?.title ?? "");
  const [categoryId, setCategoryId] = useState(
    entry?.category_id ?? categories[0]?.id ?? "",
  );
  const [startedAt, setStartedAt] = useState(defaultStart);
  const [endedAt, setEndedAt] = useState(defaultEnd);
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const startedIso = new Date(startedAt).toISOString();
    const endedIso = new Date(endedAt).toISOString();

    const parsed = timeEntryInputSchema.safeParse({
      categoryId,
      title,
      startedAt: startedIso,
      endedAt: endedIso,
      notes: notes.trim() || null,
    });

    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Invalid entry");
      setPending(false);
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not signed in");
      setPending(false);
      return;
    }

    const payload = {
      user_id: user.id,
      category_id: parsed.data.categoryId,
      title: parsed.data.title,
      started_at: parsed.data.startedAt,
      ended_at: parsed.data.endedAt,
      notes: parsed.data.notes,
    };

    const result = entry
      ? await supabase.from("time_entries").update(payload).eq("id", entry.id)
      : await supabase.from("time_entries").insert(payload);

    if (result.error) {
      setError(result.error.message);
      setPending(false);
      return;
    }

    await onSaved();
    setPending(false);
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="app-card flex flex-col gap-3">
      <h3 className="app-section-title">{entry ? "Edit entry" : "New entry"}</h3>
      <label className="flex flex-col gap-1 text-sm">
        Activity
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-xl border border-[var(--line)] px-3 py-2"
          placeholder="What did you do?"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Category
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-xl border border-[var(--line)] px-3 py-2"
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Start
        <input
          type="datetime-local"
          required
          value={startedAt}
          onChange={(e) => setStartedAt(e.target.value)}
          className="rounded-xl border border-[var(--line)] px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        End
        <input
          type="datetime-local"
          required
          value={endedAt}
          onChange={(e) => setEndedAt(e.target.value)}
          className="rounded-xl border border-[var(--line)] px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Notes (optional)
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="rounded-xl border border-[var(--line)] px-3 py-2"
        />
      </label>
      {error ? <p className="app-error-box">{error}</p> : null}
      <div className="flex gap-2">
        <button type="button" className="app-btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" disabled={pending} className="app-btn-primary">
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
