import { describe, expect, it } from "vitest";
import { lastMonths, periodRange, toISODate } from "./dates";

const now = new Date(2026, 10, 2); // Nov 2, 2026 local

describe("periodRange", () => {
  it("starts this month on the 1st", () => {
    expect(periodRange("month", now)).toEqual({ from: "2026-11-01" });
  });

  it("covers 90 days including today", () => {
    expect(periodRange("90d", now)).toEqual({ from: "2026-08-05" });
  });

  it("starts the year on Jan 1", () => {
    expect(periodRange("year", now)).toEqual({ from: "2026-01-01" });
  });

  it("has no bounds for all time", () => {
    expect(periodRange("all", now)).toEqual({});
  });
});

describe("lastMonths", () => {
  it("lists months oldest first and crosses year boundaries", () => {
    expect(lastMonths(3, new Date(2026, 0, 15))).toEqual(["2025-11", "2025-12", "2026-01"]);
  });
});

describe("toISODate", () => {
  it("uses local time, not UTC", () => {
    expect(toISODate(new Date(2026, 0, 1, 23, 30))).toBe("2026-01-01");
  });
});
