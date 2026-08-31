"use client";

import {
  addDaysLocalDate,
  durationMinutes,
  formatDuration,
  formatHours,
  todayLocalDate,
  toLocalDateString,
} from "@timewise/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DbTimeEntry } from "@/lib/db/types";

type EntryRow = DbTimeEntry & {
  categories: { name: string; color: string } | null;
};

export function WeekClient({ timezone }: { timezone: string }) {
  const today = todayLocalDate(timezone);
  const weekStart = addDaysLocalDate(today, -6);
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWeek = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const start = new Date(`${weekStart}T00:00:00`);
    const end = new Date(`${today}T23:59:59.999`);

    const { data, error: fetchError } = await supabase
      .from("time_entries")
      .select("*, categories(name, color)")
      .gte("started_at", start.toISOString())
      .lte("started_at", end.toISOString())
      .order("started_at", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setEntries([]);
    } else {
      setEntries((data as EntryRow[]) ?? []);
    }
    setLoading(false);
  }, [weekStart, today]);

  useEffect(() => {
    void loadWeek();
  }, [loadWeek]);

  const days = useMemo(() => {
    const result: string[] = [];
    for (let i = 0; i < 7; i++) {
      result.push(addDaysLocalDate(weekStart, i));
    }
    return result;
  }, [weekStart]);

  const daySummaries = useMemo(() => {
    return days.map((day) => {
      const dayEntries = entries.filter(
        (e) => toLocalDateString(e.started_at, timezone) === day,
      );
      const totalMins = dayEntries.reduce(
        (sum, e) => sum + durationMinutes(e.started_at, e.ended_at),
        0,
      );
      const byCategory: Record<string, { hours: number; color: string }> = {};
      for (const entry of dayEntries) {
        const name = entry.categories?.name ?? "Other";
        const color = entry.categories?.color ?? "#78716c";
        const hours = durationMinutes(entry.started_at, entry.ended_at) / 60;
        byCategory[name] = {
          hours: (byCategory[name]?.hours ?? 0) + hours,
          color,
        };
      }
      return { day, totalMins, byCategory, count: dayEntries.length };
    });
  }, [days, entries, timezone]);

  return (
    <div className="flex flex-col gap-3">
      <p className="app-hint">
        Last 7 days ({weekStart} → {today})
      </p>
      {error ? <p className="app-error-box">{error}</p> : null}
      {loading ? (
        <p className="app-hint">Loading…</p>
      ) : (
        daySummaries.map(({ day, totalMins, byCategory, count }) => (
          <div key={day} className="app-card">
            <div className="flex items-center justify-between">
              <p className="font-semibold">
                {day}
                {day === today ? <span className="text-[var(--muted)]"> · today</span> : null}
              </p>
              <p className="text-sm font-medium">{formatDuration(totalMins)}</p>
            </div>
            <p className="text-xs text-[var(--muted)]">{count} entries</p>
            {Object.keys(byCategory).length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {Object.entries(byCategory).map(([name, { hours, color }]) => (
                  <span
                    key={name}
                    className="rounded-full px-2 py-0.5 text-xs text-white"
                    style={{ backgroundColor: color }}
                  >
                    {name} {formatHours(hours)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-xs text-[var(--muted)]">No entries</p>
            )}
          </div>
        ))
      )}
    </div>
  );
}
