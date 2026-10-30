import {
  formatDate,
  formatDateTime,
  formatFee,
  formatNumber,
} from "@/lib/format";
import { describe, expect, it } from "vitest";

/**
 * Numerals and dates localize per language. English uses Latin digits; Arabic
 * and Kurdish Sorani use Eastern Arabic-Indic digits, so a fee or date rendered
 * in those languages must not fall back to Latin numerals.
 */
describe("format", () => {
  it("localizes numerals per language", () => {
    expect(formatNumber(25000, "en")).toBe("25,000");
    // Arabic and Kurdish use Arabic-Indic digits.
    expect(formatNumber(25000, "ar")).toMatch(/[٠-٩]/);
    expect(formatNumber(25000, "ku")).toMatch(/[٠-٩]/);
  });

  it("formats a fee with the IQD suffix in each language", () => {
    expect(formatFee(25000n, "en")).toBe("25,000 IQD");
    expect(formatFee(25000n, "ar")).toContain("IQD");
    expect(formatFee(25000n, "ku")).toContain("IQD");
  });

  it("formats a date in each language without falling back to the raw ISO string", () => {
    const iso = "2099-01-01";
    const en = formatDate(iso, "en");
    expect(en).not.toBe(iso);
    expect(en).toContain("2099");
    expect(formatDate(iso, "ar")).not.toBe(iso);
    expect(formatDate(iso, "ku")).not.toBe(iso);
  });

  it("returns the raw value for an unparseable date instead of throwing", () => {
    expect(formatDate("not-a-date", "en")).toBe("not-a-date");
  });

  it("formats a nanosecond timestamp as a date and time", () => {
    const timestamp = 1_700_000_000_000_000_000n;
    const formatted = formatDateTime(timestamp, "en");
    expect(formatted).not.toBe("—");
    expect(formatted).toMatch(/2023/);
  });
});
