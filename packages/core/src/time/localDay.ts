import { resolveTimezone } from "./timezone";

/** Local calendar date as YYYY-MM-DD in the given IANA timezone. */
export function toLocalDateString(instant: string | Date, timezone: string): string {
  const tz = resolveTimezone(timezone);
  const date = typeof instant === "string" ? new Date(instant) : instant;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value ?? "0000";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

/** Start of local day as UTC ISO string (approximation via offset parsing). */
export function localDayStartIso(localDate: string, timezone: string): string {
  return zonedTimeToUtc(localDate, "00:00:00", resolveTimezone(timezone));
}

/** End of local day (start of next day) as UTC ISO string. */
export function localDayEndIso(localDate: string, timezone: string): string {
  const [y, m, d] = localDate.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  const nextLocal = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
  return zonedTimeToUtc(nextLocal, "00:00:00", resolveTimezone(timezone));
}

function zonedTimeToUtc(localDate: string, localTime: string, timezone: string): string {
  const probe = new Date(`${localDate}T${localTime}`);
  const utcParts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(probe);

  const get = (type: string) => partsValue(utcParts, type);
  const shown = Date.UTC(
    Number(get("year")),
    Number(get("month")) - 1,
    Number(get("day")),
    Number(get("hour")),
    Number(get("minute")),
    Number(get("second")),
  );
  const offset = shown - probe.getTime();
  return new Date(probe.getTime() - offset).toISOString();
}

function partsValue(parts: Intl.DateTimeFormatPart[], type: string): string {
  const part = parts.find((p) => p.type === type)?.value ?? "0";
  return part === "24" ? "0" : part;
}

export function isWeekendLocalDate(localDate: string, timezone: string): boolean {
  const tz = resolveTimezone(timezone);
  const noonUtc = zonedTimeToUtc(localDate, "12:00:00", tz);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
  }).format(new Date(noonUtc));
  return weekday === "Sat" || weekday === "Sun";
}

export function todayLocalDate(timezone: string): string {
  return toLocalDateString(new Date(), timezone);
}

export function addDaysLocalDate(localDate: string, days: number): string {
  const [y, m, d] = localDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}
