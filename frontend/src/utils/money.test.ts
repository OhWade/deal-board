import { describe, expect, it } from "vitest";
import { centsToInput, formatCompact, formatCurrency, parseDollarsToCents } from "./money";

describe("parseDollarsToCents", () => {
  it.each([
    ["42,999", 4_299_900],
    ["$42,999", 4_299_900],
    ["42999.5", 4_299_950],
    ["1,500.05", 150_005],
    [" 0 ", 0],
  ])("parses %s", (input, expected) => {
    expect(parseDollarsToCents(input)).toBe(expected);
  });

  it.each(["", "abc", "12.345", "-5", "1.2.3"])("rejects %j", (input) => {
    expect(parseDollarsToCents(input)).toBeNull();
  });

  it("avoids floating point drift", () => {
    // 0.29 * 100 = 28.999999999999996 in floating point
    expect(parseDollarsToCents("0.29")).toBe(29);
  });
});

describe("formatting", () => {
  it("formats whole dollars without cents", () => {
    expect(formatCurrency(4_299_900)).toBe("$42,999");
  });

  it("keeps cents when present", () => {
    expect(formatCurrency(150_050)).toBe("$1,500.50");
  });

  it("compacts large numbers", () => {
    expect(formatCompact(184_772_500)).toBe("$1.85M");
    expect(formatCompact(4_299_900)).toBe("$43K");
  });

  it("round-trips through the input format", () => {
    expect(centsToInput(4_299_900)).toBe("42,999");
    expect(centsToInput(150_005)).toBe("1,500.05");
    expect(parseDollarsToCents(centsToInput(987_654_32))).toBe(987_654_32);
  });
});
