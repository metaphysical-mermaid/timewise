import { describe, expect, it } from "vitest";
import { isValidIanaTimezone, resolveTimezone } from "./timezone";

describe("resolveTimezone", () => {
  it("accepts valid IANA zones", () => {
    expect(resolveTimezone("America/Los_Angeles")).toBe("America/Los_Angeles");
    expect(resolveTimezone("UTC")).toBe("UTC");
  });

  it("maps common abbreviations", () => {
    expect(resolveTimezone("PST")).toBe("America/Los_Angeles");
    expect(resolveTimezone("EST")).toBe("America/New_York");
  });

  it("falls back when unknown", () => {
    expect(resolveTimezone("Not_A_Zone", "America/Chicago")).toBe("America/Chicago");
    expect(resolveTimezone("Not_A_Zone")).toBe("UTC");
  });
});

describe("isValidIanaTimezone", () => {
  it("accepts IANA zones", () => {
    expect(isValidIanaTimezone("America/Los_Angeles")).toBe(true);
  });
});
