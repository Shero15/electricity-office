import type { LanguageCode } from "@/i18n";

const localeMap: Record<LanguageCode, string> = {
  en: "en-GB",
  ar: "ar-IQ",
  ku: "ckb-IQ",
};

export function localeFor(language: LanguageCode): string {
  return localeMap[language];
}

/**
 * Motoko `Time.now()` values are nanosecond bigints. Convert before any
 * JavaScript Date operation.
 */
export function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(isoDate: string, language: LanguageCode): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat(localeFor(language), {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(
  timestamp: bigint,
  language: LanguageCode,
): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  return new Intl.DateTimeFormat(localeFor(language), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatNumber(value: number, language: LanguageCode): string {
  return new Intl.NumberFormat(localeFor(language)).format(value);
}

/** Format a fee expressed in whole dinars. */
export function formatFee(fee: bigint, language: LanguageCode): string {
  return `${formatNumber(Number(fee), language)} IQD`;
}

/** Today's date as an ISO `YYYY-MM-DD` string in local time. */
export function todayIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
}

/** Add days to an ISO date string, returning a new ISO date string. */
export function addDaysIso(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
}
