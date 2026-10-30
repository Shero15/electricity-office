import { AppointmentStatus } from "@/backend";
import type { BranchView, ServiceView } from "@/backend";
import { QrCode } from "@/components/QrCode";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/context/LanguageContext";
import {
  useAvailability,
  useCancelMyAppointment,
  useMyAppointment,
  useOfficeLocations,
  useRescheduleMyAppointment,
  useServiceCatalogue,
} from "@/hooks/useQueries";
import type { LanguageCode } from "@/i18n";
import { addDaysIso, formatDate, formatDateTime, todayIso } from "@/lib/format";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarClock,
  CalendarX2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  MapPin,
  Printer,
  QrCode as QrCodeIcon,
  Share2,
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

export function AppointmentDetailPage({
  appointmentId,
  justBooked,
}: {
  appointmentId: string;
  justBooked: boolean;
}) {
  const { t, language } = useLanguage();

  const id = useMemo(() => {
    try {
      return BigInt(appointmentId);
    } catch {
      return null;
    }
  }, [appointmentId]);

  const detailQuery = useMyAppointment(id);
  const servicesQuery = useServiceCatalogue();
  const branchesQuery = useOfficeLocations();
  const cancelMutation = useCancelMyAppointment();
  const rescheduleMutation = useRescheduleMyAppointment();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState(todayIso());
  const [newSlot, setNewSlot] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState(false);

  const detail = detailQuery.data ?? null;
  const appointment = detail?.appointment ?? null;
  const services = servicesQuery.data ?? [];
  const branches = branchesQuery.data ?? [];

  const availabilityQuery = useAvailability(
    appointment ? appointment.serviceId : null,
    appointment ? appointment.branchId : null,
    newDate,
  );
  const slots = availabilityQuery.data ?? [];

  const dateOptions = useMemo(
    () => Array.from({ length: 14 }, (_, i) => addDaysIso(todayIso(), i)),
    [],
  );

  const service = appointment
    ? services.find((s) => s.id === appointment.serviceId)
    : undefined;
  const branch = appointment
    ? branches.find((b) => b.id === appointment.branchId)
    : undefined;

  const canModify =
    appointment !== null &&
    appointment.status !== AppointmentStatus.cancelled &&
    appointment.status !== AppointmentStatus.checkedIn;

  function handleCancel() {
    if (!appointment) return;
    setActionError(null);
    cancelMutation.mutate(appointment.id, {
      onSuccess: () => setCancelOpen(false),
      onError: () => setActionError(t.appointments.cancelError),
    });
  }

  function handleReschedule() {
    if (!appointment || newSlot === "") return;
    setActionError(null);
    rescheduleMutation.mutate(
      { appointmentId: appointment.id, date: newDate, slot: newSlot },
      {
        onSuccess: () => {
          setRescheduleOpen(false);
          setNewSlot("");
        },
        onError: () => setActionError(t.appointments.rescheduleError),
      },
    );
  }

  async function handleCopyToken() {
    if (!detail?.qrToken) return;
    try {
      await navigator.clipboard.writeText(detail.qrToken);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setShareError(true);
    }
  }

  async function handleShare() {
    if (!appointment) return;
    setShareError(false);
    const shareData = {
      title: t.appointments.shareTitle.replace(
        "{reference}",
        appointment.reference,
      ),
      text: t.appointments.shareText
        .replace("{reference}", appointment.reference)
        .replace("{date}", formatDate(appointment.date, language))
        .replace("{time}", appointment.slot),
    };
    if (typeof navigator.share === "function") {
      try {
        await navigator.share(shareData);
      } catch {
        // The user dismissed the share sheet; no error is shown.
      }
      return;
    }
    setShareError(true);
  }

  if (detailQuery.isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <CalendarX2
          className="size-10 text-muted-foreground"
          aria-hidden="true"
        />
        <p
          data-ocid="appointment_detail.not_found_state"
          className="mt-4 text-base text-muted-foreground"
        >
          {t.appointments.notFound}
        </p>
        <Button
          asChild
          variant="outline"
          data-ocid="appointment_detail.back_button"
          className="mt-5"
        >
          <Link to="/appointments">{t.appointments.backToList}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <Button
        asChild
        variant="ghost"
        size="sm"
        data-ocid="appointment_detail.back_button"
        className="mb-6 -ms-2"
      >
        <Link to="/appointments">
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          {t.appointments.backToList}
        </Link>
      </Button>

      {justBooked ? (
        <div
          data-ocid="appointment_detail.success_state"
          className="mb-6 flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 p-5"
        >
          <CheckCircle2
            className="mt-0.5 size-5 shrink-0 text-success"
            aria-hidden="true"
          />
          <div className="flex flex-col gap-1">
            <p className="font-display text-base font-semibold text-foreground">
              {t.booking.successTitle}
            </p>
            <p className="text-sm text-muted-foreground">
              {t.booking.successBody}
            </p>
          </div>
        </div>
      ) : null}

      <Card className="rounded-xl border-border shadow-elevated">
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Zap className="size-5" aria-hidden="true" />
              </span>
              <div className="flex flex-col">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {t.appointments.reference}
                </span>
                <span className="font-mono text-lg font-semibold text-foreground">
                  {appointment.reference}
                </span>
              </div>
            </div>
            <StatusBadge status={appointment.status} />
          </div>

          <dl className="grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {t.appointments.service}
              </dt>
              <dd className="text-sm font-medium text-foreground">
                {service
                  ? serviceName(service, language)
                  : t.common.notAvailable}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {t.appointments.branch}
              </dt>
              <dd className="text-sm font-medium text-foreground">
                {branch ? branchName(branch, language) : t.common.notAvailable}
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <CalendarClock
                className="size-4 text-accent"
                aria-hidden="true"
              />
              <div className="flex flex-col">
                <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {t.appointments.date}
                </dt>
                <dd className="text-sm font-medium text-foreground">
                  {formatDate(appointment.date, language)}
                </dd>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-accent" aria-hidden="true" />
              <div className="flex flex-col">
                <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {t.appointments.time}
                </dt>
                <dd
                  className="font-mono text-sm font-medium text-foreground"
                  dir="ltr"
                >
                  {appointment.slot}
                </dd>
              </div>
            </div>
            {branch ? (
              <div className="flex items-start gap-2 sm:col-span-2">
                <MapPin
                  className="mt-0.5 size-4 text-accent"
                  aria-hidden="true"
                />
                <div className="flex flex-col">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {t.home.address}
                  </dt>
                  <dd className="text-sm text-foreground">
                    {language === "ar"
                      ? branch.addressAr
                      : language === "ku"
                        ? branch.addressKu
                        : branch.addressEn}
                  </dd>
                </div>
              </div>
            ) : null}
            {appointment.notes ? (
              <div className="flex flex-col gap-1 sm:col-span-2">
                <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {t.appointments.notes}
                </dt>
                <dd className="text-sm text-foreground">{appointment.notes}</dd>
              </div>
            ) : null}
          </dl>

          <div
            data-ocid="appointment_detail.qr_panel"
            className="flex flex-col gap-5 rounded-xl border border-border bg-muted/40 p-5 sm:flex-row sm:items-center sm:gap-6"
          >
            {detail?.qrToken ? (
              <QrCode
                value={detail.qrToken}
                title={t.appointments.qrTitle}
                className="mx-auto shrink-0 sm:mx-0"
              />
            ) : (
              <div className="mx-auto flex size-[240px] shrink-0 items-center justify-center rounded-xl border border-dashed border-border bg-card text-center sm:mx-0">
                <span className="px-6 text-sm text-muted-foreground">
                  {t.appointments.qrUnavailable}
                </span>
              </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
                  <QrCodeIcon
                    className="size-4 text-accent"
                    aria-hidden="true"
                  />
                  {t.appointments.qrTitle}
                </span>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t.appointments.qrBody}
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {t.appointments.qrTokenLabel}
                </span>
                <span
                  className="break-all font-mono text-sm text-foreground"
                  dir="ltr"
                >
                  {detail?.qrToken ?? t.common.notAvailable}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-ocid="appointment_detail.print_button"
                  onClick={() => window.print()}
                  className="rounded-lg"
                >
                  <Printer className="size-4" aria-hidden="true" />
                  {t.appointments.print}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-ocid="appointment_detail.share_button"
                  onClick={() => void handleShare()}
                  className="rounded-lg"
                >
                  <Share2 className="size-4" aria-hidden="true" />
                  {t.appointments.share}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-ocid="appointment_detail.copy_button"
                  onClick={() => void handleCopyToken()}
                  disabled={!detail?.qrToken}
                  className="rounded-lg"
                >
                  {copied ? (
                    <Check className="size-4 text-success" aria-hidden="true" />
                  ) : (
                    <Copy className="size-4" aria-hidden="true" />
                  )}
                  {copied ? t.appointments.copied : t.appointments.copyToken}
                </Button>
              </div>

              {shareError ? (
                <p
                  data-ocid="appointment_detail.share_error_state"
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {t.appointments.shareError}
                </p>
              ) : null}

              <span className="text-xs text-muted-foreground">
                {formatDateTime(appointment.createdAt, language)}
              </span>
            </div>
          </div>

          {actionError ? (
            <p
              data-ocid="appointment_detail.error_state"
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {actionError}
            </p>
          ) : null}

          {canModify ? (
            <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                data-ocid="appointment_detail.reschedule_button"
                onClick={() => {
                  setActionError(null);
                  setRescheduleOpen(true);
                }}
                className="rounded-lg"
              >
                <CalendarClock className="size-4" aria-hidden="true" />
                {t.appointments.reschedule}
              </Button>
              <Button
                type="button"
                variant="destructive"
                data-ocid="appointment_detail.cancel_button"
                onClick={() => {
                  setActionError(null);
                  setCancelOpen(true);
                }}
                className="rounded-lg"
              >
                <CalendarX2 className="size-4" aria-hidden="true" />
                {t.appointments.cancel}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Cancel dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent data-ocid="appointment_detail.cancel_dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              {t.appointments.cancelConfirmTitle}
            </DialogTitle>
            <DialogDescription>
              {t.appointments.cancelConfirmBody}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              data-ocid="appointment_detail.cancel_keep_button"
              onClick={() => setCancelOpen(false)}
            >
              {t.appointments.cancelKeep}
            </Button>
            <Button
              type="button"
              variant="destructive"
              data-ocid="appointment_detail.cancel_confirm_button"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  {t.appointments.cancelling}
                </>
              ) : (
                t.appointments.cancelConfirm
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule dialog */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent data-ocid="appointment_detail.reschedule_dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              {t.appointments.rescheduleTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="reschedule-date">
                {t.appointments.rescheduleDate}
              </Label>
              <Select
                value={newDate}
                onValueChange={(value) => {
                  setNewDate(value);
                  setNewSlot("");
                }}
              >
                <SelectTrigger
                  id="reschedule-date"
                  data-ocid="appointment_detail.reschedule_date_select"
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
            <div className="flex flex-col gap-2">
              <Label>{t.appointments.rescheduleSlot}</Label>
              {availabilityQuery.isLoading ? (
                <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  {t.booking.slotLoading}
                </div>
              ) : slots.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
                  {t.booking.slotEmpty}
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {slots.map((s, index) => (
                    <button
                      key={s.slot}
                      type="button"
                      disabled={!s.available}
                      data-ocid={`appointment_detail.reschedule_slot.${index + 1}`}
                      onClick={() => setNewSlot(s.slot)}
                      className={
                        !s.available
                          ? "cursor-not-allowed rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-sm text-muted-foreground/50"
                          : newSlot === s.slot
                            ? "rounded-lg border border-accent bg-accent px-3 py-2 font-mono text-sm text-accent-foreground"
                            : "rounded-lg border border-border bg-card px-3 py-2 font-mono text-sm text-foreground transition-smooth hover:border-accent/60 hover:bg-accent/5"
                      }
                    >
                      <span dir="ltr">{s.slot}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              data-ocid="appointment_detail.reschedule_cancel_button"
              onClick={() => setRescheduleOpen(false)}
            >
              {t.common.cancel}
            </Button>
            <Button
              type="button"
              data-ocid="appointment_detail.reschedule_confirm_button"
              onClick={handleReschedule}
              disabled={rescheduleMutation.isPending || newSlot === ""}
              className="rounded-lg bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {rescheduleMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  {t.appointments.rescheduling}
                </>
              ) : (
                t.appointments.rescheduleConfirm
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
