import { dictionaries, dirFor, isRtl, languageCodes } from "@/i18n";
import { describe, expect, it } from "vitest";

/**
 * The three dictionaries must be structurally identical: a missing key in a
 * translation would surface as an untranslated fallback string in the UI.
 */
function collectKeyPaths(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object") return [prefix];
  return Object.entries(value as Record<string, unknown>).flatMap(
    ([key, child]) =>
      collectKeyPaths(child, prefix === "" ? key : `${prefix}.${key}`),
  );
}

describe("i18n dictionaries", () => {
  it("offers Kurdish Sorani, Arabic, and English", () => {
    expect([...languageCodes].sort()).toEqual(["ar", "en", "ku"]);
  });

  it("marks Kurdish and Arabic as right-to-left and English as left-to-right", () => {
    expect(isRtl("ku")).toBe(true);
    expect(isRtl("ar")).toBe(true);
    expect(isRtl("en")).toBe(false);
    expect(dirFor("ku")).toBe("rtl");
    expect(dirFor("ar")).toBe("rtl");
    expect(dirFor("en")).toBe("ltr");
  });

  it("has the same key structure in every language", () => {
    const englishKeys = collectKeyPaths(dictionaries.en).sort();
    for (const code of ["ar", "ku"] as const) {
      expect(collectKeyPaths(dictionaries[code]).sort(), code).toEqual(
        englishKeys,
      );
    }
  });

  it("has no empty translation strings", () => {
    for (const code of languageCodes) {
      const empties = collectKeyPaths(dictionaries[code]).filter((path) => {
        const value = path
          .split(".")
          .reduce<unknown>(
            (acc, key) => (acc as Record<string, unknown>)[key],
            dictionaries[code],
          );
        return typeof value === "string" && value.trim() === "";
      });
      expect(empties, code).toEqual([]);
    }
  });

  it("translates the office hours into each language", () => {
    expect(dictionaries.en.home.hoursValue).toContain("8:30");
    expect(dictionaries.ar.home.hoursValue).toContain("٨:٣٠");
    expect(dictionaries.ku.home.hoursValue).toContain("٨:٣٠");
  });
});
