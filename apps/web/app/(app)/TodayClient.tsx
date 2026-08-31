"use client";

import {
  addDaysLocalDate,
  durationMinutes,
  formatDuration,
  formatHours,
  todayLocalDate,
  type Category,
} from "@timewise/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DbTimeEntry } from "@/lib/db/types";
import { TimeEntryForm } from "./TimeEntryForm";

type EntryRow = DbTimeEntry & {
  categories: { name: string; color: string };
};

export function TodayClient({
  timezone,
  categories,
  initialDate,
}: {
  timezone: string;
  categories: Category[];
  initialDate: string;
}) {
  const [localDate, setLocalDate] = useState(initialDate);
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EntryRow | null>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const dayStart = new Date(`${localDate}T00:00:00`);
    const dayEnd = new Date(`${localDate}T23:59:59.999`);

    const { data, error: fetchError } = await supabase
      .from("time_entries")
      .select("*, categories(name, color)")
      .gte("started_at", dayStart.toISOString())
      .lte("started_at", dayEnd.toISOString())
      .order("started_at", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setEntries([]);
    } else {
      setEntries((data as EntryRow[]) ?? []);
    }
    setLoading(false);
  }, [localDate]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const categoryTotals = useMemo(() => {
    const totals: Record<string, { hours: number; color: string }> = {};
    for (const entry of entries) {
      const mins = durationMinutes(entry.started_at, entry.ended_at);
      const name = entry.categories?.name ?? "Other";
      const color = entry.categories?.color ?? "#78716c";
      totals[name] = {
        hours: (totals[name]?.hours ?? 0) + mins / 60,
        color,
      };
    }
    return totals;
  }, [entries]);

  const totalMinutes = entries.reduce(
    (sum, e) => sum + durationMinutes(e.started_at, e.ended_at),
    0,
  );

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("time_entries").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await loadEntries();
  }

  const today = todayLocalDate(timezone);

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
          <p className="app-section-title">{localDate}</p>
          {localDate === today ? (
            <p className="text-xs text-[var(--muted)]">Today</p>
          ) : null}
        </div>
        <button
          type="button"
          className="app-btn-secondary !min-h-10 !w-auto px-3"
          onClick={() => setLocalDate(addDaysLocalDate(localDate, 1))}
        >
          →
        </button>
      </div>

      <div className="app-card">
        <p className="text-sm text-[var(--muted)]">Logged today</p>
        <p className="text-2xl font-bold">{formatDuration(totalMinutes)}</p>
        {Object.keys(categoryTotals).length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(categoryTotals).map(([name, { hours, color }]) => (
              <span
                key={name}
                className="rounded-full px-2.5 py-1 text-xs font-medium text-white"
                style={{ backgroundColor: color }}
              >
                {name} · {formatHours(hours)}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {error ? <p className="app-error-box">{error}</p> : null}

      {showForm || editing ? (
        <TimeEntryForm
          categories={categories}
          localDate={localDate}
          entry={editing}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={async () => {
            setShowForm(false);
            setEditing(null);
            await loadEntries();
          }}
        />
      ) : (
        <button type="button" className="app-btn-primary" onClick={() => setShowForm(true)}>
          Add time entry
        </button>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="app-section-title">Entries</h2>
        {loading ? (
          <p className="app-hint">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="app-hint">No entries for this day. Add one to get started.</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="app-card flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{entry.title}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {new Date(entry.started_at).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    –
                    {new Date(entry.ended_at).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    · {formatDuration(durationMinutes(entry.started_at, entry.ended_at))}
                  </p>
                  {entry.categories ? (
                    <span
                      className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs text-white"
                      style={{ backgroundColor: entry.categories.color }}
                    >
                      {entry.categories.name}
                    </span>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="text-sm text-[var(--accent)]"
                    onClick={() => setEditing(entry)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-sm text-[var(--danger)]"
                    onClick={() => void handleDelete(entry.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              {entry.notes ? <p className="text-sm text-[var(--muted)]">{entry.notes}</p> : null}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
