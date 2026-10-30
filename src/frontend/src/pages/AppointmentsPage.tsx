import type { AppointmentView, ServiceView } from "@/backend";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/context/LanguageContext";
import { useMyAppointments, useServiceCatalogue } from "@/hooks/useQueries";
import type { LanguageCode } from "@/i18n";
import { formatDate, todayIso } from "@/lib/format";
import { Link } from "@tanstack/react-router";
import { CalendarPlus, CalendarX2, Clock, MapPin, Zap } from "lucide-react";
import { useMemo } from "react";

function serviceLabel(
  appointment: AppointmentView,
  services: ServiceView[],
  language: LanguageCode,
) {
  const service = services.find((s) => s.id === appointment.serviceId);
  if (!service) return "—";
  if (language === "ar") return service.nameAr;
  if (language === "ku") return service.nameKu;
  return service.nameEn;
}

function AppointmentCard({
  appointment,
  services,
  language,
  index,
}: {
  appointment: AppointmentView;
  services: ServiceView[];
  language: LanguageCode;
  index: number;
}) {
  const { t } = useLanguage();
  return (
    <Card
      data-ocid={`appointments.item.${index + 1}`}
      className="rounded-lg border-border shadow-subtle transition-smooth hover:shadow-elevated"
    >
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Zap className="size-5" aria-hidden="true" />
            </span>
            <div className="flex flex-col">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {t.appointments.reference}
              </span>
              <span className="font-mono text-sm font-semibold text-foreground">
                {appointment.reference}
              </span>
            </div>
          </div>
          <StatusBadge status={appointment.status} />
        </div>

        <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
          <div className="flex items-center gap-2 text-sm">
            <CalendarPlus
              className="size-4 shrink-0 text-accent"
              aria-hidden="true"
            />
            <span className="text-foreground">
              {formatDate(appointment.date, language)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="size-4 shrink-0 text-accent" aria-hidden="true" />
            <span className="font-mono text-foreground" dir="ltr">
              {appointment.slot}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin
              className="size-4 shrink-0 text-accent"
              aria-hidden="true"
            />
            <span className="text-muted-foreground">
              {serviceLabel(appointment, services, language)}
            </span>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            asChild
            variant="outline"
            size="sm"
            data-ocid={`appointments.view_button.${index + 1}`}
            className="rounded-lg"
          >
            <Link
              to="/appointments/$appointmentId"
              params={{ appointmentId: String(appointment.id) }}
              search={{ booked: undefined }}
            >
              {t.appointments.detailTitle}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function AppointmentsPage() {
  const { t, language } = useLanguage();
  const appointmentsQuery = useMyAppointments();
  const servicesQuery = useServiceCatalogue();
  const appointments = appointmentsQuery.data ?? [];
  const services = servicesQuery.data ?? [];

  const { upcoming, past } = useMemo(() => {
    const today = todayIso();
    const upcomingList: AppointmentView[] = [];
    const pastList: AppointmentView[] = [];
    for (const appointment of appointments) {
      const isPast =
        appointment.date < today ||
        appointment.status === "cancelled" ||
        appointment.status === "checkedIn";
      if (isPast) pastList.push(appointment);
      else upcomingList.push(appointment);
    }
    upcomingList.sort((a, b) => a.date.localeCompare(b.date));
    pastList.sort((a, b) => b.date.localeCompare(a.date));
    return { upcoming: upcomingList, past: pastList };
  }, [appointments]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            {t.nav.myAppointments}
          </span>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {t.appointments.title}
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            {t.appointments.subtitle}
          </p>
        </div>
        <Button
          asChild
          data-ocid="appointments.book_button"
          className="h-11 rounded-lg bg-accent px-5 text-accent-foreground transition-smooth hover:bg-accent/90"
        >
          <Link to="/book" search={{ service: undefined }}>
            <CalendarPlus className="size-4" aria-hidden="true" />
            {t.appointments.emptyAction}
          </Link>
        </Button>
      </div>

      <div className="mt-10">
        {appointmentsQuery.isLoading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }, (_, i) => `appt-skeleton-${i}`).map(
              (id) => (
                <Skeleton key={id} className="h-32 rounded-xl" />
              ),
            )}
          </div>
        ) : appointmentsQuery.isError ? (
          <div
            data-ocid="appointments.error_state"
            className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center"
          >
            <p className="text-sm text-destructive">{t.appointments.error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-ocid="appointments.retry_button"
              onClick={() => void appointmentsQuery.refetch()}
              className="mt-4"
            >
              {t.home.retry}
            </Button>
          </div>
        ) : appointments.length === 0 ? (
          <div
            data-ocid="appointments.empty_state"
            className="rounded-xl border border-dashed border-border bg-card p-12 text-center"
          >
            <CalendarX2
              className="mx-auto size-9 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="mt-4 text-base font-medium text-foreground">
              {t.appointments.empty}
            </p>
            <Button
              asChild
              data-ocid="appointments.empty_action_button"
              className="mt-5 rounded-lg bg-accent text-accent-foreground transition-smooth hover:bg-accent/90"
            >
              <Link to="/book" search={{ service: undefined }}>
                {t.appointments.emptyAction}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            <section data-ocid="appointments.upcoming_section">
              <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
                {t.appointments.upcomingTitle}
              </h2>
              {upcoming.length === 0 ? (
                <p
                  data-ocid="appointments.upcoming_empty_state"
                  className="mt-4 rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground"
                >
                  {t.appointments.upcomingEmpty}
                </p>
              ) : (
                <ul className="mt-4 flex flex-col gap-4">
                  {upcoming.map((appointment, index) => (
                    <li key={String(appointment.id)}>
                      <AppointmentCard
                        appointment={appointment}
                        services={services}
                        language={language}
                        index={index}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section data-ocid="appointments.past_section">
              <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
                {t.appointments.pastTitle}
              </h2>
              {past.length === 0 ? (
                <p
                  data-ocid="appointments.past_empty_state"
                  className="mt-4 rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground"
                >
                  {t.appointments.pastEmpty}
                </p>
              ) : (
                <ul className="mt-4 flex flex-col gap-4">
                  {past.map((appointment, index) => (
                    <li key={String(appointment.id)}>
                      <AppointmentCard
                        appointment={appointment}
                        services={services}
                        language={language}
                        index={upcoming.length + index}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
