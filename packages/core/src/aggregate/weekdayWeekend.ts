import { durationHours } from "../time/duration";
import { isWeekendLocalDate, toLocalDateString } from "../time/localDay";

export type EntryForAggregation = {
  categoryName: string;
  startedAt: string;
  endedAt: string;
};

export type WeekdayWeekendSummary = {
  period: { start: string; end: string };
  weekday: Record<string, number>;
  weekend: Record<string, number>;
  totals: {
    entries: number;
    weekdayHours: number;
    weekendHours: number;
    avgDailyHours: number;
  };
};

export function aggregateWeekdayWeekend(
  entries: EntryForAggregation[],
  timezone: string,
  periodStart: string,
  periodEnd: string,
): WeekdayWeekendSummary {
  const weekday: Record<string, number> = {};
  const weekend: Record<string, number> = {};
  let weekdayHours = 0;
  let weekendHours = 0;
  const daysWithEntries = new Set<string>();

  for (const entry of entries) {
    const hours = durationHours(entry.startedAt, entry.endedAt);
    const localDate = toLocalDateString(entry.startedAt, timezone);
    daysWithEntries.add(localDate);

    if (isWeekendLocalDate(localDate, timezone)) {
      weekend[entry.categoryName] = (weekend[entry.categoryName] ?? 0) + hours;
      weekendHours += hours;
    } else {
      weekday[entry.categoryName] = (weekday[entry.categoryName] ?? 0) + hours;
      weekdayHours += hours;
    }
  }

  const totalHours = weekdayHours + weekendHours;
  const daySpan = daysBetween(periodStart, periodEnd);
  const avgDailyHours = daySpan > 0 ? totalHours / daySpan : 0;

  return {
    period: { start: periodStart, end: periodEnd },
    weekday: roundRecord(weekday),
    weekend: roundRecord(weekend),
    totals: {
      entries: entries.length,
      weekdayHours: roundHours(weekdayHours),
      weekendHours: roundHours(weekendHours),
      avgDailyHours: roundHours(avgDailyHours),
    },
  };
}

function daysBetween(start: string, end: string): number {
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const startMs = Date.UTC(sy, sm - 1, sd);
  const endMs = Date.UTC(ey, em - 1, ed);
  return Math.max(1, Math.round((endMs - startMs) / 86400000) + 1);
}

function roundHours(n: number): number {
  return Math.round(n * 100) / 100;
}

function roundRecord(record: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(record)) {
    out[key] = roundHours(value);
  }
  return out;
}
