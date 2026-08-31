import { describe, expect, it } from "vitest";
import { aggregateWeekdayWeekend } from "./weekdayWeekend";
import { durationMinutes, formatDuration } from "../time/duration";
import { isWeekendLocalDate, toLocalDateString } from "../time/localDay";

describe("duration", () => {
  it("computes minutes between instants", () => {
    expect(durationMinutes("2026-08-30T10:00:00Z", "2026-08-30T11:30:00Z")).toBe(90);
  });

  it("formats human-readable duration", () => {
    expect(formatDuration(90)).toBe("1h 30m");
    expect(formatDuration(45)).toBe("45m");
  });
});

describe("localDay", () => {
  it("maps instant to local date in timezone", () => {
    const local = toLocalDateString("2026-08-30T06:00:00Z", "America/Los_Angeles");
    expect(local).toBe("2026-08-29");
  });

  it("detects weekend in timezone", () => {
    expect(isWeekendLocalDate("2026-08-29", "America/Los_Angeles")).toBe(true);
    expect(isWeekendLocalDate("2026-08-30", "America/Los_Angeles")).toBe(true);
    expect(isWeekendLocalDate("2026-08-31", "America/Los_Angeles")).toBe(false);
  });
});

describe("aggregateWeekdayWeekend", () => {
  it("splits hours by weekday vs weekend", () => {
    const summary = aggregateWeekdayWeekend(
      [
        {
          categoryName: "Work",
          startedAt: "2026-08-28T14:00:00Z",
          endedAt: "2026-08-28T22:00:00Z",
        },
        {
          categoryName: "Personal",
          startedAt: "2026-08-30T18:00:00Z",
          endedAt: "2026-08-30T20:00:00Z",
        },
      ],
      "America/Los_Angeles",
      "2026-08-25",
      "2026-08-31",
    );

    expect(summary.weekday.Work).toBe(8);
    expect(summary.weekend.Personal).toBe(2);
    expect(summary.totals.entries).toBe(2);
  });
});
