/** Common abbreviations users enter instead of IANA names (e.g. PST → America/Los_Angeles). */
const TIMEZONE_ALIASES: Record<string, string> = {
  pst: "America/Los_Angeles",
  pdt: "America/Los_Angeles",
  mst: "America/Denver",
  mdt: "America/Denver",
  cst: "America/Chicago",
  cdt: "America/Chicago",
  est: "America/New_York",
  edt: "America/New_York",
  gmt: "UTC",
  utc: "UTC",
};

export function isValidIanaTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/** Normalize stored or user-entered timezone to a valid IANA name. */
export function resolveTimezone(timezone: string, fallback = "UTC"): string {
  const trimmed = timezone.trim();
  if (!trimmed) {
    return fallback;
  }

  const alias = TIMEZONE_ALIASES[trimmed.toLowerCase()];
  if (alias) {
    return alias;
  }

  if (isValidIanaTimezone(trimmed)) {
    return trimmed;
  }

  if (isValidIanaTimezone(fallback)) {
    return fallback;
  }

  return "UTC";
}

/** Parse timezone from settings UI — rejects unknown values instead of silently defaulting. */
export function parseTimezoneInput(
  timezone: string,
): { timezone: string } | { error: string } {
  const trimmed = timezone.trim();
  if (!trimmed) {
    return { error: "Timezone is required." };
  }

  const alias = TIMEZONE_ALIASES[trimmed.toLowerCase()];
  if (alias) {
    return { timezone: alias };
  }

  if (isValidIanaTimezone(trimmed)) {
    return { timezone: trimmed };
  }

  return {
    error: `"${trimmed}" is not a valid timezone. Use an IANA name like America/Los_Angeles (not PST).`,
  };
}
