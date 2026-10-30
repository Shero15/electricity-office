import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { type LanguageCode, languageCodes } from "@/i18n";
import { cn } from "@/lib/utils";
import { ArrowRight, Check, Languages, Zap } from "lucide-react";
import { useState } from "react";

const nativeLabels: Record<LanguageCode, string> = {
  en: "English",
  ar: "العربية",
  ku: "کوردیی سۆرانی",
};

const englishLabels: Record<LanguageCode, string> = {
  en: "English",
  ar: "Arabic",
  ku: "Kurdish Sorani",
};

const sampleText: Record<LanguageCode, string> = {
  en: "Book your electricity service appointment",
  ar: "احجز موعدك لخدمات الكهرباء",
  ku: "چاوپێکەوتنی خزمەتگوزاری کارەبات دیاری بکە",
};

export function LanguageGate() {
  const { t, setLanguage } = useLanguage();
  const [selected, setSelected] = useState<LanguageCode>("ku");

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-primary px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="relative w-full max-w-2xl">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <span className="flex size-14 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-elevated">
            <Zap className="size-7" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1">
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-primary-foreground/60">
              {t.meta.tagline}
            </span>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-primary-foreground md:text-3xl">
              {t.meta.appName}
            </h1>
          </div>
        </div>

        <div className="rounded-xl border border-primary-foreground/10 bg-card p-6 shadow-elevated md:p-8">
          <div className="mb-6 flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Languages className="size-5" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-lg font-semibold text-foreground">
                {t.language.title}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t.language.subtitle}
              </p>
            </div>
          </div>

          <div
            role="radiogroup"
            aria-label={t.language.title}
            className="grid gap-3 sm:grid-cols-3"
          >
            {languageCodes.map((code) => {
              const active = selected === code;
              return (
                <label
                  key={code}
                  data-ocid={`language.option.${code}`}
                  className={cn(
                    "group relative flex cursor-pointer flex-col items-start gap-2 rounded-lg border p-4 text-start transition-smooth",
                    active
                      ? "border-accent bg-accent/5 shadow-subtle"
                      : "border-border bg-background hover:border-accent/50 hover:bg-muted/50",
                  )}
                >
                  <input
                    type="radio"
                    name="language"
                    value={code}
                    checked={active}
                    onChange={() => setSelected(code)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full border transition-smooth",
                      active
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border text-transparent",
                    )}
                  >
                    <Check className="size-3.5" aria-hidden="true" />
                  </span>
                  <span className="font-display text-base font-semibold text-foreground">
                    {nativeLabels[code]}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {englishLabels[code]}
                  </span>
                </label>
              );
            })}
          </div>

          <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {t.language.switch}
            </p>
            <p
              dir={selected === "en" ? "ltr" : "rtl"}
              className="mt-1.5 font-display text-base font-medium text-foreground"
            >
              {sampleText[selected]}
            </p>
          </div>

          <Button
            type="button"
            data-ocid="language.continue_button"
            onClick={() => setLanguage(selected)}
            className="mt-6 h-11 w-full rounded-lg bg-accent text-accent-foreground shadow-subtle transition-smooth hover:bg-accent/90 hover:shadow-elevated"
          >
            {t.language.continue}
            <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
