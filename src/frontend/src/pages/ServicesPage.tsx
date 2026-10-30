import type { ServiceView } from "@/backend";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/context/LanguageContext";
import { useServiceCatalogue } from "@/hooks/useQueries";
import type { LanguageCode } from "@/i18n";
import { formatFee } from "@/lib/format";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ClipboardList, FileText, Zap } from "lucide-react";

function name(service: ServiceView, language: LanguageCode) {
  if (language === "ar") return service.nameAr;
  if (language === "ku") return service.nameKu;
  return service.nameEn;
}

function description(service: ServiceView, language: LanguageCode) {
  if (language === "ar") return service.descriptionAr;
  if (language === "ku") return service.descriptionKu;
  return service.descriptionEn;
}

function documents(service: ServiceView, language: LanguageCode) {
  if (language === "ar") return service.requiredDocumentsAr;
  if (language === "ku") return service.requiredDocumentsKu;
  return service.requiredDocumentsEn;
}

export function ServicesPage() {
  const { t, language } = useLanguage();
  const servicesQuery = useServiceCatalogue();
  const services = servicesQuery.data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <SectionHeading
        eyebrow={t.nav.services}
        title={t.home.servicesTitle}
        subtitle={t.home.servicesSubtitle}
      />

      <div className="mt-10">
        {servicesQuery.isLoading ? (
          <div className="grid gap-5 md:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => `svc-skeleton-${i}`).map(
              (id) => (
                <Skeleton key={id} className="h-56 rounded-xl" />
              ),
            )}
          </div>
        ) : servicesQuery.isError ? (
          <div
            data-ocid="services.error_state"
            className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center"
          >
            <p className="text-sm text-destructive">{t.home.servicesError}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-ocid="services.retry_button"
              onClick={() => void servicesQuery.refetch()}
              className="mt-4"
            >
              {t.home.retry}
            </Button>
          </div>
        ) : services.length === 0 ? (
          <div
            data-ocid="services.empty_state"
            className="rounded-xl border border-dashed border-border bg-card p-12 text-center"
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
            {services.map((service, index) => {
              const docs = documents(service, language);
              return (
                <Card
                  key={String(service.id)}
                  data-ocid={`services.card.${index + 1}`}
                  className="rounded-lg border-border shadow-subtle transition-smooth hover:shadow-elevated"
                >
                  <CardContent className="flex flex-col gap-5">
                    <div className="flex items-start gap-4">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                        <Zap className="size-5" aria-hidden="true" />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <h3 className="font-display text-lg font-semibold text-foreground">
                          {name(service, language)}
                        </h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {description(service, language)}
                        </p>
                      </div>
                    </div>

                    {docs.length > 0 ? (
                      <div className="rounded-lg border border-border bg-muted/40 p-4">
                        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          <FileText className="size-3.5" aria-hidden="true" />
                          {t.home.requiredDocuments}
                        </p>
                        <ul className="mt-2.5 flex flex-col gap-1.5">
                          {docs.map((doc) => (
                            <li
                              key={doc}
                              className="flex items-start gap-2 text-sm text-foreground"
                            >
                              <span
                                className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent"
                                aria-hidden="true"
                              />
                              {doc}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between border-t border-border pt-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          {t.home.fee}
                        </span>
                        <span className="font-display text-base font-semibold text-foreground">
                          {Number(service.fee) === 0
                            ? t.home.free
                            : formatFee(service.fee, language)}
                        </span>
                      </div>
                      <Button
                        asChild
                        data-ocid={`services.book_button.${index + 1}`}
                        className="rounded-lg bg-accent text-accent-foreground transition-smooth hover:bg-accent/90"
                      >
                        <Link
                          to="/book"
                          search={{ service: String(service.id) }}
                        >
                          {t.home.bookService}
                          <ArrowRight
                            className="size-4 rtl:rotate-180"
                            aria-hidden="true"
                          />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
