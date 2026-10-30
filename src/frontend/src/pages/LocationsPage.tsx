import type { BranchView } from "@/backend";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/context/LanguageContext";
import { useOfficeLocations } from "@/hooks/useQueries";
import type { LanguageCode } from "@/i18n";
import { Clock, MapPin, Phone } from "lucide-react";

function name(branch: BranchView, language: LanguageCode) {
  if (language === "ar") return branch.nameAr;
  if (language === "ku") return branch.nameKu;
  return branch.nameEn;
}

function address(branch: BranchView, language: LanguageCode) {
  if (language === "ar") return branch.addressAr;
  if (language === "ku") return branch.addressKu;
  return branch.addressEn;
}

export function LocationsPage() {
  const { t, language } = useLanguage();
  const locationsQuery = useOfficeLocations();
  const locations = locationsQuery.data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <SectionHeading
        eyebrow={t.nav.locations}
        title={t.home.locationsTitle}
        subtitle={t.home.locationsSubtitle}
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {locationsQuery.isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {Array.from({ length: 4 }, (_, i) => `loc-skeleton-${i}`).map(
                (id) => (
                  <Skeleton key={id} className="h-44 rounded-xl" />
                ),
              )}
            </div>
          ) : locationsQuery.isError ? (
            <div
              data-ocid="locations.error_state"
              className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center"
            >
              <p className="text-sm text-destructive">
                {t.home.locationsError}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-ocid="locations.retry_button"
                onClick={() => void locationsQuery.refetch()}
                className="mt-4"
              >
                {t.home.retry}
              </Button>
            </div>
          ) : locations.length === 0 ? (
            <div
              data-ocid="locations.empty_state"
              className="rounded-xl border border-dashed border-border bg-card p-12 text-center"
            >
              <MapPin
                className="mx-auto size-8 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm text-muted-foreground">
                {t.home.locationsEmpty}
              </p>
            </div>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2">
              {locations.map((branch, index) => (
                <li
                  key={String(branch.id)}
                  data-ocid={`locations.card.${index + 1}`}
                  className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-subtle transition-smooth hover:shadow-elevated"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <MapPin className="size-5" aria-hidden="true" />
                    </span>
                    <div className="flex min-w-0 flex-col gap-1">
                      <h3 className="font-display text-base font-semibold text-foreground">
                        {name(branch, language)}
                      </h3>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {branch.code}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {address(branch, language)}
                  </p>
                  <div className="mt-auto flex items-center gap-2 border-t border-border pt-3 text-sm text-muted-foreground">
                    <Phone className="size-4 text-accent" aria-hidden="true" />
                    <span dir="ltr">{branch.phone}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="flex flex-col gap-5">
          <Card className="rounded-lg border-border shadow-subtle">
            <CardContent className="flex flex-col gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Clock className="size-5" aria-hidden="true" />
              </span>
              <h3 className="font-display text-lg font-semibold text-foreground">
                {t.home.hoursTitle}
              </h3>
              <p className="font-display text-2xl font-bold text-foreground">
                {t.home.hoursValue}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t.home.hoursNote}
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
