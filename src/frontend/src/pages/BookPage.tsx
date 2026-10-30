import type { BranchView, ServiceView } from "@/backend";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/context/LanguageContext";
import {
  useAvailability,
  useBookAppointment,
  useOfficeLocations,
  useServiceCatalogue,
} from "@/hooks/useQueries";
import type { LanguageCode } from "@/i18n";
import { addDaysIso, formatDate, formatFee, todayIso } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  Check,
  Clock,
  Loader2,
  MapPin,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

function serviceName(service: ServiceView, language: LanguageCode) {
  if (language === "ar") return service.nameAr;
  if (language === "ku") return service.nameKu;
  return service.nameEn;
}

function branchName(branch: BranchView, language: LanguageCode) {
  if (language === "ar") return branch.nameAr;
  if (language === "ku") return branch.nameKu;
  return branch.nameEn;
}

export function BookPage({ initialServiceId }: { initialServiceId?: string }) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const servicesQuery = useServiceCatalogue();
  const locationsQuery = useOfficeLocations();
  const bookMutation = useBookAppointment();

  const services = servicesQuery.data ?? [];
  const branches = locationsQuery.data ?? [];

  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState<string>(initialServiceId ?? "");
  const [branchId, setBranchId] = useState<string>("");
  const [date, setDate] = useState<string>(todayIso());
  const [slot, setSlot] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const selectedService = useMemo(
    () => services.find((s) => String(s.id) === serviceId) ?? null,
    [services, serviceId],
  );
  const selectedBranch = useMemo(
    () => branches.find((b) => String(b.id) === branchId) ?? null,
    [branches, branchId],
  );

  const availabilityQuery = useAvailability(
    selectedService ? selectedService.id : null,
    selectedBranch ? selectedBranch.id : null,
    date,
  );
  const slots = availabilityQuery.data ?? [];

  const dateOptions = useMemo(
    () => Array.from({ length: 14 }, (_, i) => addDaysIso(todayIso(), i)),
    [],
  );

  const canContinue =
    (step === 1 && serviceId !== "") ||
    (step === 2 && branchId !== "") ||
    (step === 3 && slot !== "");

  function handleNext() {
    setError(null);
    if (step === 1 && serviceId === "") {
      setError(t.booking.selectServiceFirst);
      return;
    }
    if (step === 2 && branchId === "") {
      setError(t.booking.selectBranchFirst);
      return;
    }
    setStep((current) => Math.min(3, current + 1));
  }

  function handleBack() {
    setError(null);
    setStep((current) => Math.max(1, current - 1));
  }

  function handleSubmit() {
    setError(null);
    if (!selectedService || !selectedBranch || slot === "") {
      setError(t.booking.selectSlotFirst);
      return;
    }
    bookMutation.mutate(
      {
        serviceId: selectedService.id,
        branchId: selectedBranch.id,
        date,
        slot,
        notes,
      },
      {
        onSuccess: (detail) => {
          void navigate({
            to: "/appointments/$appointmentId",
            params: { appointmentId: String(detail.appointment.id) },
            search: { booked: "1" },
          });
        },
        onError: (error: unknown) => {
          const kind =
            error instanceof Error ? error.message : String(error ?? "");
          setError(
            kind === "conflict"
              ? t.booking.errorSlotTaken
              : t.booking.errorGeneric,
          );
        },
      },
    );
  }

  const steps = [
    { id: 1, label: t.booking.step1, icon: Zap },
    { id: 2, label: t.booking.step2, icon: MapPin },
    { id: 3, label: t.booking.step3, icon: Clock },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
      <div className="flex flex-col gap-3">
        <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          {t.nav.book}
        </span>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {t.booking.title}
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          {t.booking.subtitle}
        </p>
      </div>

      {/* Stepper */}
      <ol className="mt-8 flex items-center gap-2" data-ocid="booking.stepper">
        {steps.map((s, index) => {
          const active = step === s.id;
          const done = step > s.id;
          return (
            <li key={s.id} className="flex flex-1 items-center gap-2">
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full border font-display text-sm font-semibold transition-smooth",
                    active
                      ? "border-accent bg-accent text-accent-foreground"
                      : done
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border bg-card text-muted-foreground",
                  )}
                >
                  {done ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : (
                    s.id
                  )}
                </span>
                <span
                  className={cn(
                    "hidden text-sm font-medium sm:block",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
              </div>
              {index < steps.length - 1 ? (
                <span
                  className={cn(
                    "h-px flex-1 transition-smooth",
                    step > s.id ? "bg-accent" : "bg-border",
                  )}
                  aria-hidden="true"
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      <Card className="mt-6 rounded-xl border-border shadow-elevated">
        <CardContent className="flex flex-col gap-6">
          {step === 1 ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="booking-service">
                  {t.booking.serviceLabel}
                </Label>
                <Select value={serviceId} onValueChange={setServiceId}>
                  <SelectTrigger
                    id="booking-service"
                    data-ocid="booking.service_select"
                    className="h-11"
                  >
                    <SelectValue placeholder={t.booking.servicePlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem
                        key={String(service.id)}
                        value={String(service.id)}
                      >
                        {serviceName(service, language)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedService ? (
                <div className="rounded-lg border border-border bg-muted/40 p-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {language === "ar"
                      ? selectedService.descriptionAr
                      : language === "ku"
                        ? selectedService.descriptionKu
                        : selectedService.descriptionEn}
                  </p>
                  <p className="mt-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    {t.home.fee}:{" "}
                    <span className="text-foreground">
                      {Number(selectedService.fee) === 0
                        ? t.home.free
                        : formatFee(selectedService.fee, language)}
                    </span>
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="booking-branch">{t.booking.branchLabel}</Label>
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger
                    id="booking-branch"
                    data-ocid="booking.branch_select"
                    className="h-11"
                  >
                    <SelectValue placeholder={t.booking.branchPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem
                        key={String(branch.id)}
                        value={String(branch.id)}
                      >
                        {branchName(branch, language)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="booking-date">{t.booking.dateLabel}</Label>
                <Select value={date} onValueChange={setDate}>
                  <SelectTrigger
                    id="booking-date"
                    data-ocid="booking.date_select"
                    className="h-11"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dateOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {formatDate(option, language)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label>{t.booking.slotLabel}</Label>
                {availabilityQuery.isLoading ? (
                  <div
                    data-ocid="booking.slots_loading_state"
                    className="flex items-center gap-2 py-6 text-sm text-muted-foreground"
                  >
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                    {t.booking.slotLoading}
                  </div>
                ) : availabilityQuery.isError ? (
                  <div
                    data-ocid="booking.slots_error_state"
                    className="rounded-lg border border-destructive/30 bg-destructive/5 p-4"
                  >
                    <p className="text-sm text-destructive">
                      {t.booking.slotError}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      data-ocid="booking.slots_retry_button"
                      onClick={() => void availabilityQuery.refetch()}
                      className="mt-3"
                    >
                      {t.home.retry}
                    </Button>
                  </div>
                ) : slots.length === 0 ? (
                  <div
                    data-ocid="booking.slots_empty_state"
                    className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground"
                  >
                    {t.booking.slotEmpty}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                    {slots.map((s, index) => {
                      const disabled = !s.available;
                      const active = slot === s.slot;
                      return (
                        <button
                          key={s.slot}
                          type="button"
                          disabled={disabled}
                          data-ocid={`booking.slot.${index + 1}`}
                          onClick={() => setSlot(s.slot)}
                          className={cn(
                            "flex flex-col items-center gap-0.5 rounded-lg border px-3 py-2.5 font-mono text-sm transition-smooth",
                            disabled
                              ? "cursor-not-allowed border-border bg-muted/40 text-muted-foreground/50"
                              : active
                                ? "border-accent bg-accent text-accent-foreground shadow-subtle"
                                : "border-border bg-card text-foreground hover:border-accent/60 hover:bg-accent/5",
                          )}
                        >
                          <span dir="ltr">{s.slot}</span>
                          <span className="text-[10px] uppercase tracking-wider opacity-70">
                            {disabled
                              ? t.booking.full
                              : `${Number(s.remaining)} ${t.booking.remaining}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="booking-notes">{t.booking.notesLabel}</Label>
                <Textarea
                  id="booking-notes"
                  data-ocid="booking.notes_textarea"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder={t.booking.notesPlaceholder}
                  rows={3}
                />
              </div>

              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {t.booking.summaryTitle}
                </p>
                <dl className="mt-3 grid gap-2 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">
                      {t.booking.summaryService}
                    </dt>
                    <dd className="font-medium text-foreground">
                      {selectedService
                        ? serviceName(selectedService, language)
                        : t.common.notAvailable}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">
                      {t.booking.summaryBranch}
                    </dt>
                    <dd className="font-medium text-foreground">
                      {selectedBranch
                        ? branchName(selectedBranch, language)
                        : t.common.notAvailable}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">
                      {t.booking.summaryDate}
                    </dt>
                    <dd className="font-medium text-foreground">
                      {formatDate(date, language)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">
                      {t.booking.summarySlot}
                    </dt>
                    <dd
                      className="font-mono font-medium text-foreground"
                      dir="ltr"
                    >
                      {slot || t.common.notAvailable}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          ) : null}

          {error ? (
            <p
              data-ocid="booking.error_state"
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
            <Button
              type="button"
              variant="ghost"
              data-ocid="booking.back_button"
              onClick={handleBack}
              disabled={step === 1}
              className="rounded-lg"
            >
              <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
              {t.booking.back}
            </Button>

            {step < 3 ? (
              <Button
                type="button"
                data-ocid="booking.next_button"
                onClick={handleNext}
                disabled={!canContinue}
                className="h-11 rounded-lg bg-accent px-6 text-accent-foreground transition-smooth hover:bg-accent/90"
              >
                {t.booking.next}
                <ArrowRight
                  className="size-4 rtl:rotate-180"
                  aria-hidden="true"
                />
              </Button>
            ) : (
              <Button
                type="button"
                data-ocid="booking.confirm_button"
                onClick={handleSubmit}
                disabled={bookMutation.isPending || slot === ""}
                className="h-11 rounded-lg bg-accent px-6 text-accent-foreground transition-smooth hover:bg-accent/90"
              >
                {bookMutation.isPending ? (
                  <>
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                    {t.booking.confirming}
                  </>
                ) : (
                  <>
                    <CalendarCheck className="size-4" aria-hidden="true" />
                    {t.booking.confirm}
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
