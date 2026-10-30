import type { BranchView, ServiceView } from "@/backend";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/context/LanguageContext";
import { useOfficeLocations, useServiceCatalogue } from "@/hooks/useQueries";
import type { LanguageCode } from "@/i18n";
import { formatFee } from "@/lib/format";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarCheck,
  ClipboardList,
  Clock,
  FileText,
  MapPin,
  Phone,
  Zap,
} from "lucide-react";

function localizedServiceName(service: ServiceView, language: LanguageCode) {
  if (language === "ar") return service.nameAr;
  if (language === "ku") return service.nameKu;
  return service.nameEn;
}

function localizedServiceDescription(
  service: ServiceView,
  language: LanguageCode,
) {
  if (language === "ar") return service.descriptionAr;
  if (language === "ku") return service.descriptionKu;
  return service.descriptionEn;
}

function localizedBranchName(branch: BranchView, language: LanguageCode) {
  if (language === "ar") return branch.nameAr;
  if (language === "ku") return branch.nameKu;
  return branch.nameEn;
}

function localizedBranchAddress(branch: BranchView, language: LanguageCode) {
  if (language === "ar") return branch.addressAr;
  if (language === "ku") return branch.addressKu;
  return branch.addressEn;
}

export function HomePage() {
  const { t, language } = useLanguage();
  const servicesQuery = useServiceCatalogue();
  const locationsQuery = useOfficeLocations();

  const services = servicesQuery.data ?? [];
  const locations = locationsQuery.data ?? [];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-primary">
        <img
          src="/assets/generated/hero-office.dim_1200x800.jpg"
          alt={t.hero.imageAlt}
          className="absolute inset-0 size-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-primary/95 via-primary/85 to-primary/70"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          aria-hidden="true"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.985 0.006 250) 1px, transparent 1px), linear-gradient(90deg, oklch(0.985 0.006 250) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 py-16 text-center md:px-6 md:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/15 px-3.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            <Zap className="size-3.5" aria-hidden="true" />
            {t.hero.eyebrow}
          </span>
          <h1 className="mt-6 max-w-3xl text-balance font-display text-4xl font-bold leading-[1.1] tracking-tight text-primary-foreground md:text-6xl">
            {t.hero.title}
          </h1>
          <div
            className="voltage-rail mt-6 w-24 rounded-full"
            aria-hidden="true"
          />
          <p className="mt-6 max-w-2xl text-balance text-base leading-relaxed text-primary-foreground/80 md:text-lg">
            {t.hero.subtitle}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              data-ocid="home.hero_book_button"
              className="h-12 rounded-lg bg-accent px-7 text-base text-accent-foreground shadow-subtle transition-smooth hover:bg-accent/90 hover:shadow-elevated"
            >
              <Link to="/book" search={{ service: undefined }}>
                {t.hero.cta}
                <ArrowRight
                  className="size-4 rtl:rotate-180"
                  aria-hidden="true"
                />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              data-ocid="home.hero_services_button"
              className="h-12 rounded-lg border-primary-foreground/30 bg-transparent px-7 text-base text-primary-foreground transition-smooth hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link to="/services">{t.hero.secondary}</Link>
            </Button>
          </div>

          <dl className="mt-14 grid w-full max-w-3xl grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
            {[
              { label: t.hero.stat1, value: t.hero.stat1Value, icon: Clock },
              {
                label: t.hero.stat2,
                value: t.hero.stat2Value,
                icon: CalendarCheck,
              },
              { label: t.hero.stat3, value: t.hero.stat3Value, icon: MapPin },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-1.5 bg-card px-6 py-6"
              >
                <stat.icon className="size-5 text-accent" aria-hidden="true" />
                <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {stat.label}
                </dt>
                <dd className="font-display text-lg font-semibold text-foreground">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Services */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <SectionHeading
            eyebrow={t.nav.services}
            title={t.home.servicesTitle}
            subtitle={t.home.servicesSubtitle}
          />
          <div className="mt-10">
            {servicesQuery.isLoading ? (
              <div className="grid gap-5 md:grid-cols-2">
                {Array.from(
                  { length: 4 },
                  (_, i) => `service-skeleton-${i}`,
                ).map((id) => (
                  <Skeleton key={id} className="h-40 rounded-xl" />
                ))}
              </div>
            ) : servicesQuery.isError ? (
              <div
                data-ocid="home.services_error_state"
                className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center"
              >
                <p className="text-sm text-destructive">
                  {t.home.servicesError}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-ocid="home.services_retry_button"
                  onClick={() => void servicesQuery.refetch()}
                  className="mt-4"
                >
                  {t.home.retry}
                </Button>
              </div>
            ) : services.length === 0 ? (
              <div
                data-ocid="home.services_empty_state"
                className="rounded-xl border border-dashed border-border bg-card p-10 text-center"
              >
                <ClipboardList
                  className="mx-auto size-8 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="mt-3 text-sm text-muted-foreground">
                  {t.home.servicesEmpty}
                </p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {services.map((service, index) => (
                  <Card
                    key={String(service.id)}
                    data-ocid={`home.service_card.${index + 1}`}
                    className="rounded-lg border-border shadow-subtle transition-smooth hover:shadow-elevated"
                  >
                    <CardContent className="flex flex-col gap-4">
                      <div className="flex items-start gap-4">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                          <Zap className="size-5" aria-hidden="true" />
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <h3 className="font-display text-lg font-semibold text-foreground">
                            {localizedServiceName(service, language)}
                          </h3>
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {localizedServiceDescription(service, language)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-border pt-4">
                        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                          {t.home.fee}
                        </span>
                        <span className="font-display text-base font-semibold text-foreground">
                          {Number(service.fee) === 0
                            ? t.home.free
                            : formatFee(service.fee, language)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <SectionHeading
            align="center"
            eyebrow={t.nav.book}
            title={t.home.howTitle}
            subtitle={t.home.howSubtitle}
          />
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                title: t.home.step1Title,
                body: t.home.step1Body,
                icon: ClipboardList,
              },
              {
                title: t.home.step2Title,
                body: t.home.step2Body,
                icon: MapPin,
              },
              {
                title: t.home.step3Title,
                body: t.home.step3Body,
                icon: CalendarCheck,
              },
            ].map((step, index) => (
              <li
                key={step.title}
                data-ocid={`home.step.${index + 1}`}
                className="relative flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-subtle"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary font-display text-sm font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <step.icon
                    className="size-5 text-accent"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Locations + hours */}
      <section className="bg-muted/30">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1.4fr_1fr] md:px-6 md:py-24">
          <div className="flex flex-col gap-8">
            <SectionHeading
              eyebrow={t.nav.locations}
              title={t.home.locationsTitle}
              subtitle={t.home.locationsSubtitle}
            />
            {locationsQuery.isLoading ? (
              <div className="flex flex-col gap-4">
                {Array.from(
                  { length: 2 },
                  (_, i) => `branch-skeleton-${i}`,
                ).map((id) => (
                  <Skeleton key={id} className="h-28 rounded-xl" />
                ))}
              </div>
            ) : locationsQuery.isError ? (
              <div
                data-ocid="home.locations_error_state"
                className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"
              >
                <p className="text-sm text-destructive">
                  {t.home.locationsError}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-ocid="home.locations_retry_button"
                  onClick={() => void locationsQuery.refetch()}
                  className="mt-4"
                >
                  {t.home.retry}
                </Button>
              </div>
            ) : locations.length === 0 ? (
              <div
                data-ocid="home.locations_empty_state"
                className="rounded-xl border border-dashed border-border bg-card p-10 text-center"
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
              <ul className="flex flex-col gap-4">
                {locations.map((branch, index) => (
                  <li
                    key={String(branch.id)}
                    data-ocid={`home.branch_card.${index + 1}`}
                    className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-subtle"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                        <MapPin className="size-5" aria-hidden="true" />
                      </span>
                      <div className="flex min-w-0 flex-col gap-1">
                        <h3 className="font-display text-base font-semibold text-foreground">
                          {localizedBranchName(branch, language)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {localizedBranchAddress(branch, language)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 border-t border-border pt-3 text-sm text-muted-foreground">
                      <Phone
                        className="size-4 text-accent"
                        aria-hidden="true"
                      />
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
            <Card className="rounded-lg border-border bg-primary text-primary-foreground shadow-subtle">
              <CardContent className="flex flex-col gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <FileText className="size-5" aria-hidden="true" />
                </span>
                <h3 className="font-display text-lg font-semibold">
                  {t.home.requiredDocuments}
                </h3>
                <p className="text-sm leading-relaxed text-primary-foreground/70">
                  {t.home.servicesSubtitle}
                </p>
                <Button
                  asChild
                  data-ocid="home.sidebar_book_button"
                  className="mt-1 rounded-lg bg-accent text-accent-foreground transition-smooth hover:bg-accent/90"
                >
                  <Link to="/book" search={{ service: undefined }}>
                    {t.nav.book}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </div>
  );
}
