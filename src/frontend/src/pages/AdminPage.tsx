import { AppointmentStatus } from "@/backend";
import type {
  AppointmentFilter,
  AppointmentView,
  BranchView,
  NotificationSettingsView,
  QrVerification,
  RetentionSettingsView,
  ServiceView,
} from "@/backend";
import { QrScanner } from "@/components/QrScanner";
import { StatusBadge } from "@/components/StatusBadge";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/context/LanguageContext";
import {
  useAllAppointments,
  useAuditLog,
  useCheckInAppointment,
  useNotificationSettings,
  useOfficeLocations,
  useRetentionSettings,
  useServiceCatalogue,
  useSetAppointmentStatus,
  useSetSlotCapacity,
  useUpdateNotificationSettings,
  useUpdateRetentionSettings,
  useUpsertBranch,
  useUpsertService,
  useVerifyAppointmentQr,
} from "@/hooks/useQueries";
import type { LanguageCode } from "@/i18n";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  Bell,
  CheckCircle2,
  Layers,
  Loader2,
  Pencil,
  Plus,
  QrCode,
  ScanLine,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";

const statusOptions: AppointmentStatus[] = [
  AppointmentStatus.requested,
  AppointmentStatus.confirmed,
  AppointmentStatus.rescheduled,
  AppointmentStatus.checkedIn,
  AppointmentStatus.cancelled,
];

function serviceName(
  services: ServiceView[],
  id: bigint,
  language: LanguageCode,
) {
  const service = services.find((s) => s.id === id);
  if (!service) return "—";
  if (language === "ar") return service.nameAr;
  if (language === "ku") return service.nameKu;
  return service.nameEn;
}

function branchName(
  branches: BranchView[],
  id: bigint,
  language: LanguageCode,
) {
  const branch = branches.find((b) => b.id === id);
  if (!branch) return "—";
  if (language === "ar") return branch.nameAr;
  if (language === "ku") return branch.nameKu;
  return branch.nameEn;
}

function AppointmentsTab() {
  const { t, language } = useLanguage();
  const [status, setStatus] = useState<string>("all");
  const [service, setService] = useState<string>("all");
  const [branch, setBranch] = useState<string>("all");
  const [date, setDate] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [applied, setApplied] = useState<AppointmentFilter>({});

  const appointmentsQuery = useAllAppointments(applied);
  const servicesQuery = useServiceCatalogue();
  const branchesQuery = useOfficeLocations();
  const setStatusMutation = useSetAppointmentStatus();

  const appointments = appointmentsQuery.data ?? [];
  const services = servicesQuery.data ?? [];
  const branches = branchesQuery.data ?? [];

  function applyFilters() {
    const next: AppointmentFilter = {};
    if (status !== "all") next.status = status;
    if (service !== "all") next.serviceId = BigInt(service);
    if (branch !== "all") next.branchId = BigInt(branch);
    if (date !== "") next.date = date;
    if (search.trim() !== "") next.search = search.trim();
    setApplied(next);
  }

  function clearFilters() {
    setStatus("all");
    setService("all");
    setBranch("all");
    setDate("");
    setSearch("");
    setApplied({});
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="rounded-lg border-border shadow-subtle">
        <CardContent className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="admin-status">{t.admin.filterStatus}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger
                id="admin-status"
                data-ocid="admin.filter_status_select"
                className="h-10"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.admin.filterAll}</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t.status[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="admin-service">{t.admin.filterService}</Label>
            <Select value={service} onValueChange={setService}>
              <SelectTrigger
                id="admin-service"
                data-ocid="admin.filter_service_select"
                className="h-10"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.admin.filterAllServices}</SelectItem>
                {services.map((item) => (
                  <SelectItem key={String(item.id)} value={String(item.id)}>
                    {serviceName(services, item.id, language)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="admin-branch">{t.admin.filterBranch}</Label>
            <Select value={branch} onValueChange={setBranch}>
              <SelectTrigger
                id="admin-branch"
                data-ocid="admin.filter_branch_select"
                className="h-10"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.admin.filterAllBranches}</SelectItem>
                {branches.map((item) => (
                  <SelectItem key={String(item.id)} value={String(item.id)}>
                    {branchName(branches, item.id, language)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="admin-date">{t.admin.filterDate}</Label>
            <Input
              id="admin-date"
              type="date"
              data-ocid="admin.filter_date_input"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="h-10"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="admin-search">{t.admin.filterSearch}</Label>
            <Input
              id="admin-search"
              data-ocid="admin.filter_search_input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t.admin.filterSearchPlaceholder}
              className="h-10"
            />
          </div>
          <div className="flex items-end gap-2">
            <Button
              type="button"
              data-ocid="admin.apply_filters_button"
              onClick={applyFilters}
              className="h-10 flex-1 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {t.admin.apply}
            </Button>
            <Button
              type="button"
              variant="outline"
              data-ocid="admin.clear_filters_button"
              onClick={clearFilters}
              className="h-10"
            >
              {t.admin.clear}
            </Button>
          </div>
        </CardContent>
      </Card>

      {appointmentsQuery.isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }, (_, i) => `admin-row-${i}`).map((id) => (
            <Skeleton key={id} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : appointmentsQuery.isError ? (
        <div
          data-ocid="admin.appointments_error_state"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center"
        >
          <p className="text-sm text-destructive">{t.admin.error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-ocid="admin.appointments_retry_button"
            onClick={() => void appointmentsQuery.refetch()}
            className="mt-4"
          >
            {t.home.retry}
          </Button>
        </div>
      ) : appointments.length === 0 ? (
        <div
          data-ocid="admin.appointments_empty_state"
          className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground"
        >
          {t.admin.empty}
        </div>
      ) : (
        <Card className="overflow-hidden rounded-lg border-border shadow-subtle">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.appointments.reference}</TableHead>
                  <TableHead>{t.appointments.service}</TableHead>
                  <TableHead>{t.appointments.branch}</TableHead>
                  <TableHead>{t.appointments.date}</TableHead>
                  <TableHead>{t.appointments.time}</TableHead>
                  <TableHead>{t.appointments.status}</TableHead>
                  <TableHead className="text-end">
                    {t.admin.setStatus}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment: AppointmentView, index) => (
                  <TableRow
                    key={String(appointment.id)}
                    data-ocid={`admin.appointment_row.${index + 1}`}
                  >
                    <TableCell className="font-mono text-xs">
                      {appointment.reference}
                    </TableCell>
                    <TableCell className="text-sm">
                      {serviceName(services, appointment.serviceId, language)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {branchName(branches, appointment.branchId, language)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(appointment.date, language)}
                    </TableCell>
                    <TableCell className="font-mono text-sm" dir="ltr">
                      {appointment.slot}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={appointment.status} />
                    </TableCell>
                    <TableCell className="text-end">
                      <Select
                        value={appointment.status}
                        onValueChange={(value) =>
                          setStatusMutation.mutate({
                            appointmentId: appointment.id,
                            status: value as AppointmentStatus,
                          })
                        }
                      >
                        <SelectTrigger
                          data-ocid={`admin.status_select.${index + 1}`}
                          className="ms-auto h-9 w-40"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {t.status[option]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}

function ScannerTab() {
  const { t, language } = useLanguage();
  const [token, setToken] = useState("");
  const [verification, setVerification] = useState<QrVerification | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verifyMutation = useVerifyAppointmentQr();
  const checkInMutation = useCheckInAppointment();
  const servicesQuery = useServiceCatalogue();
  const branchesQuery = useOfficeLocations();
  const services = servicesQuery.data ?? [];
  const branches = branchesQuery.data ?? [];

  function runVerify(value: string) {
    const trimmed = value.trim();
    if (trimmed === "") return;
    setError(null);
    setVerification(null);
    verifyMutation.mutate(trimmed, {
      onSuccess: (result) => setVerification(result),
      onError: () => setError(t.admin.scannerError),
    });
  }

  function handleVerify() {
    runVerify(token);
  }

  function handleCheckIn() {
    const trimmed = token.trim();
    if (trimmed === "") return;
    setError(null);
    checkInMutation.mutate(trimmed, {
      onSuccess: (result) => setVerification(result),
      onError: () => setError(t.admin.checkInError),
    });
  }

  function handleDetected(value: string) {
    setToken(value);
    runVerify(value);
  }

  const detail =
    verification && verification.__kind__ !== "invalid"
      ? verification.__kind__ === "valid"
        ? verification.valid
        : verification.__kind__ === "alreadyCheckedIn"
          ? verification.alreadyCheckedIn
          : verification.cancelled
      : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <Card className="rounded-lg border-border shadow-subtle">
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <ScanLine className="size-5" aria-hidden="true" />
            </span>
            <div className="flex flex-col">
              <h2 className="font-display text-lg font-semibold text-foreground">
                {t.admin.scannerTitle}
              </h2>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t.admin.scannerBody}
          </p>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">
              {t.admin.scannerCameraTitle}
            </span>
            <QrScanner
              onDetected={handleDetected}
              disabled={verifyMutation.isPending || checkInMutation.isPending}
            />
          </div>

          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <span className="text-sm font-medium text-foreground">
              {t.admin.scannerManualTitle}
            </span>
            <Label htmlFor="scanner-token">{t.admin.scannerInput}</Label>
            <Input
              id="scanner-token"
              data-ocid="admin.scanner_input"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder={t.admin.scannerPlaceholder}
              className="h-11 font-mono"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              data-ocid="admin.scanner_verify_button"
              onClick={handleVerify}
              disabled={verifyMutation.isPending || token.trim() === ""}
              className="h-11 flex-1 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {verifyMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  {t.admin.scannerChecking}
                </>
              ) : (
                <>
                  <QrCode className="size-4" aria-hidden="true" />
                  {t.admin.scannerSubmit}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              data-ocid="admin.scanner_checkin_button"
              onClick={handleCheckIn}
              disabled={checkInMutation.isPending || token.trim() === ""}
              className="h-11 rounded-lg"
            >
              {checkInMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  {t.admin.checkingIn}
                </>
              ) : (
                t.admin.checkIn
              )}
            </Button>
          </div>

          {error ? (
            <p
              data-ocid="admin.scanner_error_state"
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-lg border-border shadow-subtle">
        <CardContent className="flex flex-col gap-4">
          {verification === null ? (
            <div
              data-ocid="admin.scanner_idle_state"
              className="flex flex-col items-center justify-center gap-3 py-12 text-center"
            >
              <QrCode
                className="size-9 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-sm text-muted-foreground">
                {t.admin.scannerBody}
              </p>
            </div>
          ) : verification.__kind__ === "invalid" ? (
            <div
              data-ocid="admin.scanner_invalid_state"
              className="flex flex-col items-center gap-3 py-12 text-center"
            >
              <XCircle className="size-9 text-destructive" aria-hidden="true" />
              <p className="text-sm font-medium text-destructive">
                {t.admin.scannerInvalid}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div
                data-ocid="admin.scanner_result_state"
                className={
                  verification.__kind__ === "valid"
                    ? "flex items-start gap-3 rounded-lg border border-success/30 bg-success/10 p-4"
                    : verification.__kind__ === "alreadyCheckedIn"
                      ? "flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4"
                      : "flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4"
                }
              >
                {verification.__kind__ === "valid" ? (
                  <CheckCircle2
                    className="mt-0.5 size-5 shrink-0 text-success"
                    aria-hidden="true"
                  />
                ) : (
                  <XCircle
                    className="mt-0.5 size-5 shrink-0 text-destructive"
                    aria-hidden="true"
                  />
                )}
                <p className="text-sm font-medium text-foreground">
                  {verification.__kind__ === "valid"
                    ? t.admin.scannerValid
                    : verification.__kind__ === "alreadyCheckedIn"
                      ? t.admin.scannerAlready
                      : t.admin.scannerCancelled}
                </p>
              </div>

              {detail ? (
                <dl className="grid gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">
                      {t.appointments.reference}
                    </dt>
                    <dd className="font-mono font-medium text-foreground">
                      {detail.appointment.reference}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">
                      {t.appointments.service}
                    </dt>
                    <dd className="font-medium text-foreground">
                      {serviceName(
                        services,
                        detail.appointment.serviceId,
                        language,
                      )}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">
                      {t.appointments.branch}
                    </dt>
                    <dd className="font-medium text-foreground">
                      {branchName(
                        branches,
                        detail.appointment.branchId,
                        language,
                      )}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">
                      {t.appointments.date}
                    </dt>
                    <dd className="font-medium text-foreground">
                      {formatDate(detail.appointment.date, language)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">
                      {t.appointments.time}
                    </dt>
                    <dd
                      className="font-mono font-medium text-foreground"
                      dir="ltr"
                    >
                      {detail.appointment.slot}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">
                      {t.appointments.status}
                    </dt>
                    <dd>
                      <StatusBadge status={detail.appointment.status} />
                    </dd>
                  </div>
                </dl>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AuditTab() {
  const { t, language } = useLanguage();
  const [limit, setLimit] = useState<bigint>(50n);
  const auditQuery = useAuditLog(limit);
  const entries = auditQuery.data ?? [];

  const limitOptions = useMemo(
    () => [
      { value: "25", label: "25" },
      { value: "50", label: "50" },
      { value: "100", label: "100" },
      { value: "200", label: "200" },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-lg font-semibold text-foreground">
          {t.admin.auditTitle}
        </h2>
        <div className="flex items-center gap-2">
          <Label
            htmlFor="audit-limit"
            className="text-sm text-muted-foreground"
          >
            {t.admin.auditLimit}
          </Label>
          <Select
            value={String(limit)}
            onValueChange={(value) => setLimit(BigInt(value))}
          >
            <SelectTrigger
              id="audit-limit"
              data-ocid="admin.audit_limit_select"
              className="h-9 w-24"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {limitOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {auditQuery.isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, i) => `audit-row-${i}`).map((id) => (
            <Skeleton key={id} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : auditQuery.isError ? (
        <div
          data-ocid="admin.audit_error_state"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center"
        >
          <p className="text-sm text-destructive">{t.admin.auditError}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-ocid="admin.audit_retry_button"
            onClick={() => void auditQuery.refetch()}
            className="mt-4"
          >
            {t.home.retry}
          </Button>
        </div>
      ) : entries.length === 0 ? (
        <div
          data-ocid="admin.audit_empty_state"
          className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground"
        >
          {t.admin.auditEmpty}
        </div>
      ) : (
        <Card className="overflow-hidden rounded-lg border-border shadow-subtle">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.admin.auditTime}</TableHead>
                  <TableHead>{t.admin.auditAction}</TableHead>
                  <TableHead>{t.admin.auditSubject}</TableHead>
                  <TableHead>{t.admin.auditDetail}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, index) => (
                  <TableRow
                    key={String(entry.id)}
                    data-ocid={`admin.audit_row.${index + 1}`}
                  >
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDateTime(entry.createdAt, language)}
                    </TableCell>
                    <TableCell>
                      <span className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-foreground">
                        {entry.action}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {entry.subject}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.detail}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}

type ServiceFormState = {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  nameKu: string;
  descriptionEn: string;
  descriptionAr: string;
  descriptionKu: string;
  fee: string;
  active: boolean;
  documentsEn: string;
  documentsAr: string;
  documentsKu: string;
};

type BranchFormState = {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  nameKu: string;
  addressEn: string;
  addressAr: string;
  addressKu: string;
  phone: string;
  active: boolean;
};

const emptyServiceForm: ServiceFormState = {
  id: "",
  code: "",
  nameEn: "",
  nameAr: "",
  nameKu: "",
  descriptionEn: "",
  descriptionAr: "",
  descriptionKu: "",
  fee: "0",
  active: true,
  documentsEn: "",
  documentsAr: "",
  documentsKu: "",
};

const emptyBranchForm: BranchFormState = {
  id: "",
  code: "",
  nameEn: "",
  nameAr: "",
  nameKu: "",
  addressEn: "",
  addressAr: "",
  addressKu: "",
  phone: "",
  active: true,
};

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

function serviceToForm(service: ServiceView): ServiceFormState {
  return {
    id: String(service.id),
    code: service.code,
    nameEn: service.nameEn,
    nameAr: service.nameAr,
    nameKu: service.nameKu,
    descriptionEn: service.descriptionEn,
    descriptionAr: service.descriptionAr,
    descriptionKu: service.descriptionKu,
    fee: String(service.fee),
    active: service.active,
    documentsEn: service.requiredDocumentsEn.join("\n"),
    documentsAr: service.requiredDocumentsAr.join("\n"),
    documentsKu: service.requiredDocumentsKu.join("\n"),
  };
}

function branchToForm(branch: BranchView): BranchFormState {
  return {
    id: String(branch.id),
    code: branch.code,
    nameEn: branch.nameEn,
    nameAr: branch.nameAr,
    nameKu: branch.nameKu,
    addressEn: branch.addressEn,
    addressAr: branch.addressAr,
    addressKu: branch.addressKu,
    phone: branch.phone,
    active: branch.active,
  };
}

function CatalogueTab() {
  const { t, language } = useLanguage();
  const servicesQuery = useServiceCatalogue();
  const branchesQuery = useOfficeLocations();
  const upsertService = useUpsertService();
  const upsertBranch = useUpsertBranch();
  const setCapacity = useSetSlotCapacity();

  const services = servicesQuery.data ?? [];
  const branches = branchesQuery.data ?? [];

  const [serviceForm, setServiceForm] =
    useState<ServiceFormState>(emptyServiceForm);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [serviceSaved, setServiceSaved] = useState(false);

  const [branchForm, setBranchForm] =
    useState<BranchFormState>(emptyBranchForm);
  const [branchError, setBranchError] = useState<string | null>(null);
  const [branchSaved, setBranchSaved] = useState(false);

  const [capacityBranch, setCapacityBranch] = useState<string>("");
  const [capacityService, setCapacityService] = useState<string>("");
  const [capacityPerSlot, setCapacityPerSlot] = useState<string>("1");
  const [capacityError, setCapacityError] = useState<string | null>(null);
  const [capacitySaved, setCapacitySaved] = useState(false);

  function handleServiceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServiceError(null);
    setServiceSaved(false);
    if (
      serviceForm.code.trim() === "" ||
      serviceForm.nameEn.trim() === "" ||
      serviceForm.nameAr.trim() === "" ||
      serviceForm.nameKu.trim() === ""
    ) {
      setServiceError(t.admin.serviceRequired);
      return;
    }
    const feeValue = Number(serviceForm.fee);
    const payload: ServiceView = {
      id: serviceForm.id === "" ? 0n : BigInt(serviceForm.id),
      code: serviceForm.code.trim(),
      nameEn: serviceForm.nameEn.trim(),
      nameAr: serviceForm.nameAr.trim(),
      nameKu: serviceForm.nameKu.trim(),
      descriptionEn: serviceForm.descriptionEn.trim(),
      descriptionAr: serviceForm.descriptionAr.trim(),
      descriptionKu: serviceForm.descriptionKu.trim(),
      fee: BigInt(Number.isFinite(feeValue) && feeValue > 0 ? feeValue : 0),
      active: serviceForm.active,
      requiredDocumentsEn: splitLines(serviceForm.documentsEn),
      requiredDocumentsAr: splitLines(serviceForm.documentsAr),
      requiredDocumentsKu: splitLines(serviceForm.documentsKu),
    };
    upsertService.mutate(payload, {
      onSuccess: () => {
        setServiceForm(emptyServiceForm);
        setServiceSaved(true);
      },
      onError: () => setServiceError(t.admin.serviceSaveError),
    });
  }

  function handleBranchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBranchError(null);
    setBranchSaved(false);
    if (
      branchForm.code.trim() === "" ||
      branchForm.nameEn.trim() === "" ||
      branchForm.nameAr.trim() === "" ||
      branchForm.nameKu.trim() === ""
    ) {
      setBranchError(t.admin.branchRequired);
      return;
    }
    const payload: BranchView = {
      id: branchForm.id === "" ? 0n : BigInt(branchForm.id),
      code: branchForm.code.trim(),
      nameEn: branchForm.nameEn.trim(),
      nameAr: branchForm.nameAr.trim(),
      nameKu: branchForm.nameKu.trim(),
      addressEn: branchForm.addressEn.trim(),
      addressAr: branchForm.addressAr.trim(),
      addressKu: branchForm.addressKu.trim(),
      phone: branchForm.phone.trim(),
      active: branchForm.active,
    };
    upsertBranch.mutate(payload, {
      onSuccess: () => {
        setBranchForm(emptyBranchForm);
        setBranchSaved(true);
      },
      onError: () => setBranchError(t.admin.branchSaveError),
    });
  }

  function handleCapacitySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCapacityError(null);
    setCapacitySaved(false);
    const perSlot = Number(capacityPerSlot);
    if (
      capacityBranch === "" ||
      capacityService === "" ||
      !Number.isFinite(perSlot) ||
      perSlot < 1
    ) {
      setCapacityError(t.admin.capacityRequired);
      return;
    }
    setCapacity.mutate(
      {
        branchId: BigInt(capacityBranch),
        serviceId: BigInt(capacityService),
        perSlot: BigInt(Math.floor(perSlot)),
      },
      {
        onSuccess: () => setCapacitySaved(true),
        onError: () => setCapacityError(t.admin.capacitySaveError),
      },
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-lg font-semibold text-foreground">
          {t.admin.catalogueTitle}
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t.admin.catalogueSubtitle}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Services */}
        <Card className="rounded-lg border-border shadow-subtle">
          <CardContent className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-base font-semibold text-foreground">
                {t.admin.servicesTitle}
              </h3>
              <span className="font-mono text-xs text-muted-foreground">
                {services.length}
              </span>
            </div>

            {servicesQuery.isLoading ? (
              <Skeleton className="h-24 rounded-lg" />
            ) : services.length === 0 ? (
              <p
                data-ocid="admin.services_empty_state"
                className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground"
              >
                {t.admin.servicesEmpty}
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {services.map((service, index) => (
                  <li
                    key={String(service.id)}
                    data-ocid={`admin.service_row.${index + 1}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium text-foreground">
                        {serviceName(services, service.id, language)}
                      </span>
                      <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        {service.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          service.active
                            ? "rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success"
                            : "rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                        }
                      >
                        {service.active ? t.admin.serviceActive : t.common.no}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        data-ocid={`admin.service_edit_button.${index + 1}`}
                        onClick={() => {
                          setServiceForm(serviceToForm(service));
                          setServiceError(null);
                          setServiceSaved(false);
                        }}
                        className="h-8 rounded-lg"
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                        {t.admin.edit}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <form
              onSubmit={handleServiceSubmit}
              className="flex flex-col gap-4 border-t border-border pt-5"
              noValidate
            >
              <div className="flex items-center gap-2">
                <Plus className="size-4 text-accent" aria-hidden="true" />
                <span className="text-sm font-medium text-foreground">
                  {serviceForm.id === ""
                    ? t.admin.serviceNew
                    : t.admin.serviceEdit}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="service-code">{t.admin.serviceCode}</Label>
                  <Input
                    id="service-code"
                    data-ocid="admin.service_code_input"
                    value={serviceForm.code}
                    onChange={(event) =>
                      setServiceForm((f) => ({
                        ...f,
                        code: event.target.value,
                      }))
                    }
                    placeholder={t.admin.serviceCodePlaceholder}
                    className="h-10 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="service-fee">{t.admin.serviceFee}</Label>
                  <Input
                    id="service-fee"
                    type="number"
                    min="0"
                    data-ocid="admin.service_fee_input"
                    value={serviceForm.fee}
                    onChange={(event) =>
                      setServiceForm((f) => ({ ...f, fee: event.target.value }))
                    }
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="service-name-en">
                    {t.admin.serviceNameEn}
                  </Label>
                  <Input
                    id="service-name-en"
                    data-ocid="admin.service_name_en_input"
                    value={serviceForm.nameEn}
                    onChange={(event) =>
                      setServiceForm((f) => ({
                        ...f,
                        nameEn: event.target.value,
                      }))
                    }
                    className="h-10"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="service-name-ar">
                    {t.admin.serviceNameAr}
                  </Label>
                  <Input
                    id="service-name-ar"
                    dir="rtl"
                    data-ocid="admin.service_name_ar_input"
                    value={serviceForm.nameAr}
                    onChange={(event) =>
                      setServiceForm((f) => ({
                        ...f,
                        nameAr: event.target.value,
                      }))
                    }
                    className="h-10"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="service-name-ku">
                    {t.admin.serviceNameKu}
                  </Label>
                  <Input
                    id="service-name-ku"
                    dir="rtl"
                    data-ocid="admin.service_name_ku_input"
                    value={serviceForm.nameKu}
                    onChange={(event) =>
                      setServiceForm((f) => ({
                        ...f,
                        nameKu: event.target.value,
                      }))
                    }
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="service-desc-en">
                    {t.admin.serviceDescriptionEn}
                  </Label>
                  <Textarea
                    id="service-desc-en"
                    data-ocid="admin.service_desc_en_input"
                    value={serviceForm.descriptionEn}
                    onChange={(event) =>
                      setServiceForm((f) => ({
                        ...f,
                        descriptionEn: event.target.value,
                      }))
                    }
                    rows={2}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="service-desc-ar">
                    {t.admin.serviceDescriptionAr}
                  </Label>
                  <Textarea
                    id="service-desc-ar"
                    dir="rtl"
                    data-ocid="admin.service_desc_ar_input"
                    value={serviceForm.descriptionAr}
                    onChange={(event) =>
                      setServiceForm((f) => ({
                        ...f,
                        descriptionAr: event.target.value,
                      }))
                    }
                    rows={2}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="service-desc-ku">
                    {t.admin.serviceDescriptionKu}
                  </Label>
                  <Textarea
                    id="service-desc-ku"
                    dir="rtl"
                    data-ocid="admin.service_desc_ku_input"
                    value={serviceForm.descriptionKu}
                    onChange={(event) =>
                      setServiceForm((f) => ({
                        ...f,
                        descriptionKu: event.target.value,
                      }))
                    }
                    rows={2}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="service-docs-en">
                    {t.admin.serviceDocumentsEn}
                  </Label>
                  <Textarea
                    id="service-docs-en"
                    data-ocid="admin.service_docs_en_input"
                    value={serviceForm.documentsEn}
                    onChange={(event) =>
                      setServiceForm((f) => ({
                        ...f,
                        documentsEn: event.target.value,
                      }))
                    }
                    rows={3}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="service-docs-ar">
                    {t.admin.serviceDocumentsAr}
                  </Label>
                  <Textarea
                    id="service-docs-ar"
                    dir="rtl"
                    data-ocid="admin.service_docs_ar_input"
                    value={serviceForm.documentsAr}
                    onChange={(event) =>
                      setServiceForm((f) => ({
                        ...f,
                        documentsAr: event.target.value,
                      }))
                    }
                    rows={3}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="service-docs-ku">
                    {t.admin.serviceDocumentsKu}
                  </Label>
                  <Textarea
                    id="service-docs-ku"
                    dir="rtl"
                    data-ocid="admin.service_docs_ku_input"
                    value={serviceForm.documentsKu}
                    onChange={(event) =>
                      setServiceForm((f) => ({
                        ...f,
                        documentsKu: event.target.value,
                      }))
                    }
                    rows={3}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  data-ocid="admin.service_active_checkbox"
                  checked={serviceForm.active}
                  onChange={(event) =>
                    setServiceForm((f) => ({
                      ...f,
                      active: event.target.checked,
                    }))
                  }
                  className="size-4 rounded border-border accent-accent"
                />
                {t.admin.serviceActive}
              </label>

              {serviceError ? (
                <p
                  data-ocid="admin.service_error_state"
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                >
                  {serviceError}
                </p>
              ) : null}
              {serviceSaved ? (
                <p
                  data-ocid="admin.service_saved_state"
                  className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
                >
                  {t.admin.serviceSaved}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  data-ocid="admin.service_save_button"
                  disabled={upsertService.isPending}
                  className="h-10 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {upsertService.isPending ? (
                    <>
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                      {t.admin.serviceSaving}
                    </>
                  ) : (
                    t.admin.serviceSave
                  )}
                </Button>
                {serviceForm.id !== "" ? (
                  <Button
                    type="button"
                    variant="outline"
                    data-ocid="admin.service_cancel_button"
                    onClick={() => {
                      setServiceForm(emptyServiceForm);
                      setServiceError(null);
                      setServiceSaved(false);
                    }}
                    className="h-10 rounded-lg"
                  >
                    {t.admin.cancelEdit}
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Branches */}
        <Card className="rounded-lg border-border shadow-subtle">
          <CardContent className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-base font-semibold text-foreground">
                {t.admin.branchesTitle}
              </h3>
              <span className="font-mono text-xs text-muted-foreground">
                {branches.length}
              </span>
            </div>

            {branchesQuery.isLoading ? (
              <Skeleton className="h-24 rounded-lg" />
            ) : branches.length === 0 ? (
              <p
                data-ocid="admin.branches_empty_state"
                className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground"
              >
                {t.admin.branchesEmpty}
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {branches.map((branch, index) => (
                  <li
                    key={String(branch.id)}
                    data-ocid={`admin.branch_row.${index + 1}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium text-foreground">
                        {branchName(branches, branch.id, language)}
                      </span>
                      <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        {branch.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          branch.active
                            ? "rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success"
                            : "rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                        }
                      >
                        {branch.active ? t.admin.branchActive : t.common.no}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        data-ocid={`admin.branch_edit_button.${index + 1}`}
                        onClick={() => {
                          setBranchForm(branchToForm(branch));
                          setBranchError(null);
                          setBranchSaved(false);
                        }}
                        className="h-8 rounded-lg"
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                        {t.admin.edit}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <form
              onSubmit={handleBranchSubmit}
              className="flex flex-col gap-4 border-t border-border pt-5"
              noValidate
            >
              <div className="flex items-center gap-2">
                <Plus className="size-4 text-accent" aria-hidden="true" />
                <span className="text-sm font-medium text-foreground">
                  {branchForm.id === ""
                    ? t.admin.branchNew
                    : t.admin.branchEdit}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="branch-code">{t.admin.branchCode}</Label>
                  <Input
                    id="branch-code"
                    data-ocid="admin.branch_code_input"
                    value={branchForm.code}
                    onChange={(event) =>
                      setBranchForm((f) => ({ ...f, code: event.target.value }))
                    }
                    placeholder={t.admin.branchCodePlaceholder}
                    className="h-10 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="branch-phone">{t.admin.branchPhone}</Label>
                  <Input
                    id="branch-phone"
                    dir="ltr"
                    data-ocid="admin.branch_phone_input"
                    value={branchForm.phone}
                    onChange={(event) =>
                      setBranchForm((f) => ({
                        ...f,
                        phone: event.target.value,
                      }))
                    }
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="branch-name-en">{t.admin.branchNameEn}</Label>
                  <Input
                    id="branch-name-en"
                    data-ocid="admin.branch_name_en_input"
                    value={branchForm.nameEn}
                    onChange={(event) =>
                      setBranchForm((f) => ({
                        ...f,
                        nameEn: event.target.value,
                      }))
                    }
                    className="h-10"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="branch-name-ar">{t.admin.branchNameAr}</Label>
                  <Input
                    id="branch-name-ar"
                    dir="rtl"
                    data-ocid="admin.branch_name_ar_input"
                    value={branchForm.nameAr}
                    onChange={(event) =>
                      setBranchForm((f) => ({
                        ...f,
                        nameAr: event.target.value,
                      }))
                    }
                    className="h-10"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="branch-name-ku">{t.admin.branchNameKu}</Label>
                  <Input
                    id="branch-name-ku"
                    dir="rtl"
                    data-ocid="admin.branch_name_ku_input"
                    value={branchForm.nameKu}
                    onChange={(event) =>
                      setBranchForm((f) => ({
                        ...f,
                        nameKu: event.target.value,
                      }))
                    }
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="branch-address-en">
                    {t.admin.branchAddressEn}
                  </Label>
                  <Textarea
                    id="branch-address-en"
                    data-ocid="admin.branch_address_en_input"
                    value={branchForm.addressEn}
                    onChange={(event) =>
                      setBranchForm((f) => ({
                        ...f,
                        addressEn: event.target.value,
                      }))
                    }
                    rows={2}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="branch-address-ar">
                    {t.admin.branchAddressAr}
                  </Label>
                  <Textarea
                    id="branch-address-ar"
                    dir="rtl"
                    data-ocid="admin.branch_address_ar_input"
                    value={branchForm.addressAr}
                    onChange={(event) =>
                      setBranchForm((f) => ({
                        ...f,
                        addressAr: event.target.value,
                      }))
                    }
                    rows={2}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="branch-address-ku">
                    {t.admin.branchAddressKu}
                  </Label>
                  <Textarea
                    id="branch-address-ku"
                    dir="rtl"
                    data-ocid="admin.branch_address_ku_input"
                    value={branchForm.addressKu}
                    onChange={(event) =>
                      setBranchForm((f) => ({
                        ...f,
                        addressKu: event.target.value,
                      }))
                    }
                    rows={2}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  data-ocid="admin.branch_active_checkbox"
                  checked={branchForm.active}
                  onChange={(event) =>
                    setBranchForm((f) => ({
                      ...f,
                      active: event.target.checked,
                    }))
                  }
                  className="size-4 rounded border-border accent-accent"
                />
                {t.admin.branchActive}
              </label>

              {branchError ? (
                <p
                  data-ocid="admin.branch_error_state"
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                >
                  {branchError}
                </p>
              ) : null}
              {branchSaved ? (
                <p
                  data-ocid="admin.branch_saved_state"
                  className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
                >
                  {t.admin.branchSaved}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  data-ocid="admin.branch_save_button"
                  disabled={upsertBranch.isPending}
                  className="h-10 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {upsertBranch.isPending ? (
                    <>
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                      {t.admin.branchSaving}
                    </>
                  ) : (
                    t.admin.branchSave
                  )}
                </Button>
                {branchForm.id !== "" ? (
                  <Button
                    type="button"
                    variant="outline"
                    data-ocid="admin.branch_cancel_button"
                    onClick={() => {
                      setBranchForm(emptyBranchForm);
                      setBranchError(null);
                      setBranchSaved(false);
                    }}
                    className="h-10 rounded-lg"
                  >
                    {t.admin.cancelEdit}
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Slot capacity */}
      <Card className="rounded-lg border-border shadow-subtle">
        <CardContent className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Layers className="size-5" aria-hidden="true" />
            </span>
            <div className="flex flex-col">
              <h3 className="font-display text-base font-semibold text-foreground">
                {t.admin.capacityTitle}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t.admin.capacitySubtitle}
              </p>
            </div>
          </div>

          <form
            onSubmit={handleCapacitySubmit}
            className="flex flex-col gap-4"
            noValidate
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="capacity-branch">
                  {t.admin.capacityBranch}
                </Label>
                <Select
                  value={capacityBranch}
                  onValueChange={setCapacityBranch}
                >
                  <SelectTrigger
                    id="capacity-branch"
                    data-ocid="admin.capacity_branch_select"
                    className="h-10"
                  >
                    <SelectValue placeholder={t.booking.branchPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem
                        key={String(branch.id)}
                        value={String(branch.id)}
                      >
                        {branchName(branches, branch.id, language)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="capacity-service">
                  {t.admin.capacityService}
                </Label>
                <Select
                  value={capacityService}
                  onValueChange={setCapacityService}
                >
                  <SelectTrigger
                    id="capacity-service"
                    data-ocid="admin.capacity_service_select"
                    className="h-10"
                  >
                    <SelectValue placeholder={t.booking.servicePlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem
                        key={String(service.id)}
                        value={String(service.id)}
                      >
                        {serviceName(services, service.id, language)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="capacity-per-slot">
                  {t.admin.capacityPerSlot}
                </Label>
                <Input
                  id="capacity-per-slot"
                  type="number"
                  min="1"
                  data-ocid="admin.capacity_per_slot_input"
                  value={capacityPerSlot}
                  onChange={(event) => setCapacityPerSlot(event.target.value)}
                  className="h-10"
                />
              </div>
            </div>

            {capacityError ? (
              <p
                data-ocid="admin.capacity_error_state"
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              >
                {capacityError}
              </p>
            ) : null}
            {capacitySaved ? (
              <p
                data-ocid="admin.capacity_saved_state"
                className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
              >
                {t.admin.capacitySaved}
              </p>
            ) : null}

            <div>
              <Button
                type="submit"
                data-ocid="admin.capacity_save_button"
                disabled={setCapacity.isPending}
                className="h-10 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {setCapacity.isPending ? (
                  <>
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                    {t.admin.capacitySaving}
                  </>
                ) : (
                  t.admin.capacitySave
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsTab() {
  const { t } = useLanguage();
  const notificationQuery = useNotificationSettings();
  const retentionQuery = useRetentionSettings();
  const updateNotifications = useUpdateNotificationSettings();
  const updateRetention = useUpdateRetentionSettings();

  const [notifications, setNotifications] =
    useState<NotificationSettingsView | null>(null);
  const [retention, setRetention] = useState<RetentionSettingsView | null>(
    null,
  );
  const [notificationSaved, setNotificationSaved] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(
    null,
  );
  const [retentionSaved, setRetentionSaved] = useState(false);
  const [retentionError, setRetentionError] = useState<string | null>(null);

  const notificationData = notifications ?? notificationQuery.data ?? null;
  const retentionData = retention ?? retentionQuery.data ?? null;

  const notificationFields: Array<{
    key: keyof NotificationSettingsView;
    label: string;
  }> = [
    { key: "appointmentRequested", label: t.admin.notifyRequested },
    { key: "appointmentConfirmed", label: t.admin.notifyConfirmed },
    { key: "appointmentRescheduled", label: t.admin.notifyRescheduled },
    { key: "appointmentCancelled", label: t.admin.notifyCancelled },
    { key: "appointmentReminder", label: t.admin.notifyReminder },
    { key: "checkIn", label: t.admin.notifyCheckIn },
    { key: "registrationVerification", label: t.admin.notifyRegistration },
  ];

  function handleNotificationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!notificationData) return;
    setNotificationError(null);
    setNotificationSaved(false);
    updateNotifications.mutate(notificationData, {
      onSuccess: () => setNotificationSaved(true),
      onError: () => setNotificationError(t.admin.settingsSaveError),
    });
  }

  function handleRetentionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!retentionData) return;
    setRetentionError(null);
    setRetentionSaved(false);
    if (
      retentionData.appointmentRetentionDays < 1n ||
      retentionData.auditRetentionDays < 1n
    ) {
      setRetentionError(t.admin.retentionRequired);
      return;
    }
    updateRetention.mutate(retentionData, {
      onSuccess: () => setRetentionSaved(true),
      onError: () => setRetentionError(t.admin.settingsSaveError),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="rounded-lg border-border shadow-subtle">
        <CardContent className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Bell className="size-5" aria-hidden="true" />
            </span>
            <div className="flex flex-col">
              <h2 className="font-display text-lg font-semibold text-foreground">
                {t.admin.notificationsTitle}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t.admin.notificationsSubtitle}
              </p>
            </div>
          </div>

          {notificationQuery.isLoading || !notificationData ? (
            <Skeleton className="h-40 rounded-lg" />
          ) : (
            <form
              onSubmit={handleNotificationSubmit}
              className="flex flex-col gap-4"
              noValidate
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {notificationFields.map((field) => (
                  <label
                    key={field.key}
                    className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground"
                  >
                    <input
                      type="checkbox"
                      data-ocid={`admin.notify_${field.key}_checkbox`}
                      checked={notificationData[field.key]}
                      onChange={(event) =>
                        setNotifications({
                          ...notificationData,
                          [field.key]: event.target.checked,
                        })
                      }
                      className="size-4 rounded border-border accent-accent"
                    />
                    {field.label}
                  </label>
                ))}
              </div>

              {notificationError ? (
                <p
                  data-ocid="admin.notifications_error_state"
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                >
                  {notificationError}
                </p>
              ) : null}
              {notificationSaved ? (
                <p
                  data-ocid="admin.notifications_saved_state"
                  className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
                >
                  {t.admin.settingsSaved}
                </p>
              ) : null}

              <div>
                <Button
                  type="submit"
                  data-ocid="admin.notifications_save_button"
                  disabled={updateNotifications.isPending}
                  className="h-10 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {updateNotifications.isPending ? (
                    <>
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                      {t.admin.settingsSaving}
                    </>
                  ) : (
                    t.admin.settingsSave
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-lg border-border shadow-subtle">
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-lg font-semibold text-foreground">
              {t.admin.retentionTitle}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t.admin.retentionSubtitle}
            </p>
          </div>

          {retentionQuery.isLoading || !retentionData ? (
            <Skeleton className="h-32 rounded-lg" />
          ) : (
            <form
              onSubmit={handleRetentionSubmit}
              className="flex flex-col gap-4"
              noValidate
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="retention-appointments">
                    {t.admin.retentionAppointments}
                  </Label>
                  <Input
                    id="retention-appointments"
                    type="number"
                    min="1"
                    data-ocid="admin.retention_appointments_input"
                    value={String(retentionData.appointmentRetentionDays)}
                    onChange={(event) =>
                      setRetention({
                        ...retentionData,
                        appointmentRetentionDays: BigInt(
                          Math.max(1, Number(event.target.value) || 1),
                        ),
                      })
                    }
                    className="h-10"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="retention-audit">
                    {t.admin.retentionAudit}
                  </Label>
                  <Input
                    id="retention-audit"
                    type="number"
                    min="1"
                    data-ocid="admin.retention_audit_input"
                    value={String(retentionData.auditRetentionDays)}
                    onChange={(event) =>
                      setRetention({
                        ...retentionData,
                        auditRetentionDays: BigInt(
                          Math.max(1, Number(event.target.value) || 1),
                        ),
                      })
                    }
                    className="h-10"
                  />
                </div>
              </div>

              {retentionError ? (
                <p
                  data-ocid="admin.retention_error_state"
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                >
                  {retentionError}
                </p>
              ) : null}
              {retentionSaved ? (
                <p
                  data-ocid="admin.retention_saved_state"
                  className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
                >
                  {t.admin.settingsSaved}
                </p>
              ) : null}

              <div>
                <Button
                  type="submit"
                  data-ocid="admin.retention_save_button"
                  disabled={updateRetention.isPending}
                  className="h-10 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {updateRetention.isPending ? (
                    <>
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                      {t.admin.settingsSaving}
                    </>
                  ) : (
                    t.admin.settingsSave
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminPage() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <div className="flex flex-col gap-3">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          {t.nav.admin}
        </span>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {t.admin.title}
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          {t.admin.subtitle}
        </p>
      </div>

      <Tabs defaultValue="appointments" className="mt-8">
        <TabsList data-ocid="admin.tabs" className="h-11">
          <TabsTrigger
            value="appointments"
            data-ocid="admin.tab.appointments"
            className="h-9"
          >
            {t.admin.tabs.appointments}
          </TabsTrigger>
          <TabsTrigger
            value="scanner"
            data-ocid="admin.tab.scanner"
            className="h-9"
          >
            {t.admin.tabs.scanner}
          </TabsTrigger>
          <TabsTrigger
            value="audit"
            data-ocid="admin.tab.audit"
            className="h-9"
          >
            {t.admin.tabs.audit}
          </TabsTrigger>
          <TabsTrigger
            value="catalogue"
            data-ocid="admin.tab.catalogue"
            className="h-9"
          >
            {t.admin.catalogueTab}
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            data-ocid="admin.tab.settings"
            className="h-9"
          >
            {t.admin.settingsTab}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="appointments" className="mt-6">
          <AppointmentsTab />
        </TabsContent>
        <TabsContent value="scanner" className="mt-6">
          <ScannerTab />
        </TabsContent>
        <TabsContent value="audit" className="mt-6">
          <AuditTab />
        </TabsContent>
        <TabsContent value="catalogue" className="mt-6">
          <CatalogueTab />
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
