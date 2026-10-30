import { ar } from "./ar";
import { type Dictionary, en } from "./en";
import { ku } from "./ku";

export type LanguageCode = "en" | "ar" | "ku";

export const dictionaries: Record<LanguageCode, Dictionary> = { en, ar, ku };

export const languageCodes: LanguageCode[] = ["ku", "ar", "en"];

export const rtlLanguages: LanguageCode[] = ["ar", "ku"];

export function isRtl(language: LanguageCode): boolean {
  return rtlLanguages.includes(language);
}

export function dirFor(language: LanguageCode): "rtl" | "ltr" {
  return isRtl(language) ? "rtl" : "ltr";
}

export function getDictionary(language: LanguageCode): Dictionary {
  return dictionaries[language];
}

export type { Dictionary };
