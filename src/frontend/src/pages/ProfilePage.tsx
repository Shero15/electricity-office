import type {
  CustomerView,
  DeviceView,
  Language,
  ProfileUpdate,
} from "@/backend";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useLanguage } from "@/context/LanguageContext";
import {
  useMyDevices,
  useMyProfile,
  useRegisterMyDevice,
  useRevokeMyDevice,
  useUpdateMyProfile,
} from "@/hooks/useQueries";
import { type LanguageCode, languageCodes } from "@/i18n";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Check,
  IdCard,
  Laptop,
  Loader2,
  Mail,
  Phone,
  ShieldAlert,
  Smartphone,
  Trash2,
  UserRound,
} from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";

const nativeLabels: Record<LanguageCode, string> = {
  en: "English",
  ar: "العربية",
  ku: "کوردیی سۆرانی",
};

function DetailRow({
  icon,
  label,
  value,
  hint,
  mono,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-border py-3 last:border-b-0">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
        <span
          className={cn(
            "break-words text-sm font-medium text-foreground",
            mono && "font-mono",
          )}
          dir={mono ? "ltr" : undefined}
        >
          {value}
        </span>
        {hint ? (
          <span className="text-xs leading-relaxed text-muted-foreground">
            {hint}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function DeviceRow({
  device,
  index,
  language,
  onRevoke,
  isRevoking,
}: {
  device: DeviceView;
  index: number;
  language: LanguageCode;
  onRevoke: (device: DeviceView) => void;
  isRevoking: boolean;
}) {
  const { t } = useLanguage();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <li
      data-ocid={`profile.device.item.${index + 1}`}
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <Laptop className="size-4" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-foreground">
            {device.deviceLabel}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {t.profile.deviceLastSeen}:{" "}
            {formatDateTime(device.lastSeenAt, language)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {device.revoked ? (
          <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-destructive">
            {t.profile.deviceRevoked}
          </span>
        ) : (
          <>
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-ocid={`profile.device.revoke_button.${index + 1}`}
                onClick={() => setConfirmOpen(true)}
                disabled={isRevoking}
                className="rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                {isRevoking ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="size-4" aria-hidden="true" />
                )}
                {t.profile.revoke}
              </Button>
              <AlertDialogContent data-ocid="profile.device.revoke_dialog">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display">
                    {t.profile.revokeConfirmTitle}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t.profile.revokeConfirmBody}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    data-ocid="profile.device.revoke_cancel_button"
                    className="rounded-lg"
                  >
                    {t.profile.revokeKeep}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    data-ocid="profile.device.revoke_confirm_button"
                    onClick={() => onRevoke(device)}
                    className="rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t.profile.revokeConfirm}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </li>
  );
}

export function ProfilePage() {
  const { t, language } = useLanguage();
  const profileQuery = useMyProfile();
  const devicesQuery = useMyDevices();
  const updateProfile = useUpdateMyProfile();
  const revokeDevice = useRevokeMyDevice();
  const registerDevice = useRegisterMyDevice();

  const profile = profileQuery.data ?? null;
  const devices = devicesQuery.data ?? [];

  const [initialized, setInitialized] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [preferredLanguage, setPreferredLanguage] =
    useState<LanguageCode>(language);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [deviceLabel, setDeviceLabel] = useState("");
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [deviceSuccess, setDeviceSuccess] = useState(false);

  useEffect(() => {
    if (profile && !initialized) {
      setFullName(profile.fullName);
      setEmail(profile.email ?? "");
      setPreferredLanguage(profile.language as unknown as LanguageCode);
      setInitialized(true);
    }
  }, [profile, initialized]);

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);
    setSaved(false);
    if (fullName.trim().length === 0) {
      setSaveError(t.profile.saveError);
      return;
    }
    const update: ProfileUpdate = {
      fullName: fullName.trim(),
      email: email.trim(),
      language: preferredLanguage as unknown as Language,
    };
    updateProfile.mutate(update, {
      onSuccess: () => setSaved(true),
      onError: () => setSaveError(t.profile.saveError),
    });
  }

  function handleRegisterDevice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDeviceError(null);
    setDeviceSuccess(false);
    const label = deviceLabel.trim();
    registerDevice.mutate(label === "" ? "This device" : label, {
      onSuccess: () => {
        setDeviceLabel("");
        setDeviceSuccess(true);
      },
      onError: () => setDeviceError(t.profile.registerDeviceError),
    });
  }

  if (profileQuery.isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  if (profileQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <div
          data-ocid="profile.error_state"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center"
        >
          <p className="text-sm text-destructive">{t.profile.errorLoad}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-ocid="profile.retry_button"
            onClick={() => void profileQuery.refetch()}
            className="mt-4"
          >
            {t.profile.retry}
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <ShieldAlert className="size-7" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight text-foreground">
          {t.profile.notRegisteredTitle}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {t.profile.notRegisteredBody}
        </p>
        <Button
          asChild
          data-ocid="profile.register_button"
          className="mt-6 h-11 rounded-lg bg-accent px-6 text-accent-foreground shadow-subtle transition-smooth hover:bg-accent/90 hover:shadow-elevated"
        >
          <Link to="/register">{t.profile.notRegisteredAction}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16">
      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          {t.nav.myAppointments}
        </span>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {t.profile.title}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          {t.profile.subtitle}
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Card className="rounded-lg border-border shadow-subtle">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  {t.profile.accountTitle}
                </h2>
                <span
                  data-ocid="profile.verification_badge"
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider",
                    profile.verified
                      ? "border-success/30 bg-success/10 text-success-foreground"
                      : "border-warning/30 bg-warning/10 text-warning-foreground",
                  )}
                >
                  {profile.verified ? (
                    <BadgeCheck className="size-3.5" aria-hidden="true" />
                  ) : (
                    <ShieldAlert className="size-3.5" aria-hidden="true" />
                  )}
                  {profile.verified ? t.profile.verified : t.profile.unverified}
                </span>
              </div>

              <div className="mt-4">
                <DetailRow
                  icon={<UserRound className="size-4" aria-hidden="true" />}
                  label={t.profile.fullName}
                  value={profile.fullName}
                />
                <DetailRow
                  icon={<Phone className="size-4" aria-hidden="true" />}
                  label={t.profile.phone}
                  value={profile.phone}
                  hint={t.profile.phoneLocked}
                  mono
                />
                <DetailRow
                  icon={<IdCard className="size-4" aria-hidden="true" />}
                  label={t.profile.nationalId}
                  value={profile.nationalId}
                  hint={t.profile.nationalIdLocked}
                  mono
                />
                <DetailRow
                  icon={<Mail className="size-4" aria-hidden="true" />}
                  label={t.profile.email}
                  value={profile.email ?? t.common.notAvailable}
                  mono
                />
                <DetailRow
                  icon={<Smartphone className="size-4" aria-hidden="true" />}
                  label={t.profile.memberSince}
                  value={formatDateTime(profile.createdAt, language)}
                />
              </div>

              <p className="mt-4 rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                {profile.verified
                  ? t.profile.verifiedNote
                  : t.profile.unverifiedNote}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-border shadow-subtle">
            <CardContent className="pt-6">
              <h2 className="font-display text-lg font-semibold text-foreground">
                {t.profile.editTitle}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {t.profile.editSubtitle}
              </p>

              <form
                onSubmit={handleSave}
                className="mt-5 flex flex-col gap-4"
                noValidate
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="profile-full-name">
                    {t.profile.fullName}
                  </Label>
                  <Input
                    id="profile-full-name"
                    data-ocid="profile.full_name_input"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    autoComplete="name"
                    className="h-11 rounded-lg"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="profile-email">{t.profile.email}</Label>
                  <Input
                    id="profile-email"
                    data-ocid="profile.email_input"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    dir="ltr"
                    className="h-11 rounded-lg"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="profile-language">{t.profile.language}</Label>
                  <Select
                    value={preferredLanguage}
                    onValueChange={(value) =>
                      setPreferredLanguage(value as LanguageCode)
                    }
                  >
                    <SelectTrigger
                      id="profile-language"
                      data-ocid="profile.language_select"
                      className="h-11 w-full rounded-lg"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languageCodes.map((code) => (
                        <SelectItem key={code} value={code}>
                          {nativeLabels[code]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {saveError ? (
                  <p
                    data-ocid="profile.save_error_state"
                    role="alert"
                    className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                  >
                    {saveError}
                  </p>
                ) : null}

                {saved && !saveError ? (
                  <p
                    data-ocid="profile.save_success_state"
                    className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success-foreground"
                  >
                    <Check className="size-4" aria-hidden="true" />
                    {t.profile.saved}
                  </p>
                ) : null}

                <Button
                  type="submit"
                  data-ocid="profile.save_button"
                  disabled={updateProfile.isPending}
                  className="h-11 rounded-lg bg-accent px-6 text-accent-foreground shadow-subtle transition-smooth hover:bg-accent/90 hover:shadow-elevated"
                >
                  {updateProfile.isPending ? (
                    <>
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                      {t.profile.saving}
                    </>
                  ) : (
                    t.profile.save
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit rounded-lg border-border shadow-subtle">
          <CardContent className="pt-6">
            <h2 className="font-display text-lg font-semibold text-foreground">
              {t.profile.devicesTitle}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {t.profile.devicesSubtitle}
            </p>

            <form
              onSubmit={handleRegisterDevice}
              className="mt-5 flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="profile-device-name">
                  {t.profile.deviceNameLabel}
                </Label>
                <Input
                  id="profile-device-name"
                  data-ocid="profile.device_name_input"
                  value={deviceLabel}
                  onChange={(event) => setDeviceLabel(event.target.value)}
                  placeholder={t.profile.deviceNamePlaceholder}
                  className="h-11 rounded-lg"
                />
              </div>
              {deviceError ? (
                <p
                  data-ocid="profile.device_error_state"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {deviceError}
                </p>
              ) : null}
              {deviceSuccess && !deviceError ? (
                <p
                  data-ocid="profile.device_success_state"
                  className="text-sm text-success-foreground"
                >
                  {t.profile.registerDeviceSuccess}
                </p>
              ) : null}
              <Button
                type="submit"
                variant="outline"
                data-ocid="profile.register_device_button"
                disabled={registerDevice.isPending}
                className="h-11 rounded-lg"
              >
                {registerDevice.isPending ? (
                  <>
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                    {t.profile.registeringDevice}
                  </>
                ) : (
                  <>
                    <Laptop className="size-4" aria-hidden="true" />
                    {t.profile.registerDevice}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-5">
              {devicesQuery.isLoading ? (
                <div className="flex flex-col gap-3">
                  {Array.from(
                    { length: 2 },
                    (_, i) => `device-skeleton-${i}`,
                  ).map((id) => (
                    <Skeleton key={id} className="h-16 rounded-lg" />
                  ))}
                </div>
              ) : devices.length === 0 ? (
                <div
                  data-ocid="profile.devices_empty_state"
                  className="rounded-lg border border-dashed border-border bg-card p-8 text-center"
                >
                  <Smartphone
                    className="mx-auto size-8 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <p className="mt-3 text-sm text-muted-foreground">
                    {t.profile.devicesEmpty}
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {devices.map((device, index) => (
                    <DeviceRow
                      key={String(device.id)}
                      device={device}
                      index={index}
                      language={language}
                      isRevoking={
                        revokeDevice.isPending &&
                        revokeDevice.variables === device.id
                      }
                      onRevoke={(target) => revokeDevice.mutate(target.id)}
                    />
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
