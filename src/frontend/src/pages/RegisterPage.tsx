import { createActor } from "@/backend";
import type { Language, RegisterInput } from "@/backend";
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
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { type LanguageCode, languageCodes } from "@/i18n";
import { cn } from "@/lib/utils";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  Loader2,
  Lock,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { type FormEvent, useState } from "react";

type Step = 1 | 2 | 3;

const nativeLabels: Record<LanguageCode, string> = {
  en: "English",
  ar: "العربية",
  ku: "کوردیی سۆرانی",
};

function errorKey(error: unknown): string {
  const kind =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  switch (kind) {
    case "duplicatePhone":
      return "errorDuplicatePhone";
    case "conflict":
      return "errorConflict";
    case "invalidInput":
      return "errorInvalidInput";
    case "rateLimited":
      return "errorRateLimited";
    case "notAuthorized":
      return "errorNotAuthorized";
    case "notFound":
      return "errorNotFound";
    case "internal":
      return "errorInternal";
    default:
      return "errorGeneric";
  }
}

function errorMessage(t: ReturnType<typeof useLanguage>["t"], error: unknown) {
  const key = errorKey(error) as keyof typeof t.register;
  return t.register[key] as string;
}

export function RegisterPage() {
  const { t, language } = useLanguage();
  const { isAuthenticated, isInitializing, isLoggingIn, login } = useAuth();
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [email, setEmail] = useState("");
  const [preferredLanguage, setPreferredLanguage] =
    useState<LanguageCode>(language);
  const [code, setCode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);

  const registerMutation = useMutation({
    mutationFn: async (input: RegisterInput) => {
      if (!actor) throw new Error("internal");
      const result = await actor.registerCustomer(input);
      if (result.__kind__ === "err") throw new Error(result.err.__kind__);
      return result.ok;
    },
  });

  const requestCodeMutation = useMutation({
    mutationFn: async (targetPhone: string) => {
      if (!actor) throw new Error("internal");
      const result = await actor.requestPhoneVerification(targetPhone);
      if (result.__kind__ === "err") throw new Error(result.err.__kind__);
      return true;
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (args: { phone: string; code: string }) => {
      if (!actor) throw new Error("internal");
      const result = await actor.verifyPhone(args.phone, args.code);
      if (result.__kind__ === "err") throw new Error(result.err.__kind__);
      return result.ok;
    },
  });

  const detailsValid =
    fullName.trim().length > 0 &&
    phone.replace(/\D/g, "").length >= 6 &&
    nationalId.trim().length > 0;

  function handleDetailsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!detailsValid) {
      setFormError(t.register.errorInvalidInput);
      return;
    }
    registerMutation.mutate(
      {
        fullName: fullName.trim(),
        phone: phone.trim(),
        nationalId: nationalId.trim(),
        email: email.trim() === "" ? undefined : email.trim(),
        language: preferredLanguage as unknown as Language,
      },
      {
        onSuccess: () => {
          setStep(2);
          requestCodeMutation.mutate(phone.trim(), {
            onSuccess: () => setCodeSent(true),
            onError: (error) => setFormError(errorMessage(t, error)),
          });
        },
        onError: (error) => setFormError(errorMessage(t, error)),
      },
    );
  }

  function handleVerifySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCodeError(null);
    if (code.trim().length === 0) {
      setCodeError(t.register.errorInvalidInput);
      return;
    }
    verifyMutation.mutate(
      { phone: phone.trim(), code: code.trim() },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: ["myProfile"] });
          setStep(3);
        },
        onError: (error) => setCodeError(errorMessage(t, error)),
      },
    );
  }

  function handleResend() {
    setCodeError(null);
    requestCodeMutation.mutate(phone.trim(), {
      onSuccess: () => setCodeSent(true),
      onError: (error) => setCodeError(errorMessage(t, error)),
    });
  }

  if (isInitializing) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16">
        <Loader2
          className="size-8 animate-spin text-accent"
          aria-hidden="true"
        />
        <p
          data-ocid="register.loading_state"
          className="mt-4 text-sm text-muted-foreground"
        >
          {t.common.loading}
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Lock className="size-7" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight text-foreground">
          {t.auth.requiredTitle}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {t.auth.requiredBody}
        </p>
        <Button
          type="button"
          data-ocid="register.signin_button"
          onClick={login}
          disabled={isLoggingIn}
          className="mt-6 h-11 rounded-lg bg-accent px-6 text-accent-foreground shadow-subtle transition-smooth hover:bg-accent/90 hover:shadow-elevated"
        >
          {isLoggingIn ? t.auth.signingIn : t.auth.signInButton}
        </Button>
        <Button
          asChild
          variant="ghost"
          data-ocid="register.back_home_button"
          className="mt-2"
        >
          <Link to="/">{t.auth.backHome}</Link>
        </Button>
      </div>
    );
  }

  const steps = [
    { id: 1 as const, label: t.register.step1 },
    { id: 2 as const, label: t.register.step2 },
    { id: 3 as const, label: t.register.step3 },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          {t.auth.registerLink}
        </span>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {t.register.title}
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          {t.register.subtitle}
        </p>
      </div>

      <ol
        data-ocid="register.stepper"
        className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        {steps.map((item, index) => {
          const active = step === item.id;
          const done = step > item.id;
          return (
            <li key={item.id} className="flex flex-1 items-center gap-3">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-semibold transition-smooth",
                  done
                    ? "border-accent bg-accent text-accent-foreground"
                    : active
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-muted text-muted-foreground",
                )}
              >
                {done ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : (
                  item.id
                )}
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  active || done ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {item.label}
              </span>
              {index < steps.length - 1 ? (
                <span
                  className="hidden h-px flex-1 bg-border sm:block"
                  aria-hidden="true"
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      <Card className="mt-8 rounded-lg border-border shadow-subtle">
        <CardContent className="pt-6">
          {step === 1 ? (
            <form
              onSubmit={handleDetailsSubmit}
              className="flex flex-col gap-5"
              noValidate
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <UserPlus className="size-5" aria-hidden="true" />
                </span>
                <div className="flex flex-col">
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    {t.register.step1}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t.register.requiredNote}
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="register-full-name">
                    {t.register.fullNameLabel} *
                  </Label>
                  <Input
                    id="register-full-name"
                    data-ocid="register.full_name_input"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder={t.register.fullNamePlaceholder}
                    autoComplete="name"
                    required
                    className="h-11 rounded-lg"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="register-phone">
                    {t.register.phoneLabel} *
                  </Label>
                  <Input
                    id="register-phone"
                    data-ocid="register.phone_input"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder={t.register.phonePlaceholder}
                    inputMode="tel"
                    autoComplete="tel"
                    dir="ltr"
                    required
                    className="h-11 rounded-lg"
                  />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {t.register.phoneHint}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="register-national-id">
                    {t.register.nationalIdLabel} *
                  </Label>
                  <Input
                    id="register-national-id"
                    data-ocid="register.national_id_input"
                    value={nationalId}
                    onChange={(event) => setNationalId(event.target.value)}
                    placeholder={t.register.nationalIdPlaceholder}
                    dir="ltr"
                    required
                    className="h-11 rounded-lg"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="register-email">
                    {t.register.emailLabel}{" "}
                    <span className="text-muted-foreground">
                      ({t.common.optional})
                    </span>
                  </Label>
                  <Input
                    id="register-email"
                    data-ocid="register.email_input"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={t.register.emailPlaceholder}
                    autoComplete="email"
                    dir="ltr"
                    className="h-11 rounded-lg"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="register-language">
                    {t.register.languageLabel}
                  </Label>
                  <Select
                    value={preferredLanguage}
                    onValueChange={(value) =>
                      setPreferredLanguage(value as LanguageCode)
                    }
                  >
                    <SelectTrigger
                      id="register-language"
                      data-ocid="register.language_select"
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
              </div>

              {formError ? (
                <p
                  data-ocid="register.error_state"
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                >
                  {formError}
                </p>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-between">
                <Button
                  asChild
                  variant="ghost"
                  data-ocid="register.cancel_button"
                  className="rounded-lg"
                >
                  <Link to="/">{t.common.cancel}</Link>
                </Button>
                <Button
                  type="submit"
                  data-ocid="register.submit_button"
                  disabled={registerMutation.isPending || !detailsValid}
                  className="h-11 rounded-lg bg-accent px-6 text-accent-foreground shadow-subtle transition-smooth hover:bg-accent/90 hover:shadow-elevated"
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                      {t.register.submitting}
                    </>
                  ) : (
                    <>
                      {t.register.next}
                      <ArrowRight
                        className="size-4 rtl:rotate-180"
                        aria-hidden="true"
                      />
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : null}

          {step === 2 ? (
            <form
              onSubmit={handleVerifySubmit}
              className="flex flex-col gap-5"
              noValidate
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <ShieldCheck className="size-5" aria-hidden="true" />
                </span>
                <div className="flex flex-col">
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    {t.register.step2}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t.register.codeHint}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {t.register.phoneLabel}
                </p>
                <p
                  className="mt-1 font-mono text-sm font-semibold text-foreground"
                  dir="ltr"
                >
                  {phone}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="register-code">{t.register.codeLabel}</Label>
                <Input
                  id="register-code"
                  data-ocid="register.code_input"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder={t.register.codePlaceholder}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  dir="ltr"
                  className="h-11 rounded-lg font-mono tracking-[0.3em]"
                />
              </div>

              {codeError ? (
                <p
                  data-ocid="register.code_error_state"
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                >
                  {codeError}
                </p>
              ) : null}

              {codeSent && !codeError ? (
                <p
                  data-ocid="register.code_sent_state"
                  className="rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success-foreground"
                >
                  {t.register.codeHint}
                </p>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  data-ocid="register.back_button"
                  onClick={() => {
                    setCodeError(null);
                    setStep(1);
                  }}
                  className="rounded-lg"
                >
                  <ArrowLeft
                    className="size-4 rtl:rotate-180"
                    aria-hidden="true"
                  />
                  {t.register.back}
                </Button>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    variant="outline"
                    data-ocid="register.resend_button"
                    onClick={handleResend}
                    disabled={requestCodeMutation.isPending}
                    className="h-11 rounded-lg"
                  >
                    {requestCodeMutation.isPending ? (
                      <>
                        <Loader2
                          className="size-4 animate-spin"
                          aria-hidden="true"
                        />
                        {t.register.sendingCode}
                      </>
                    ) : (
                      t.register.resend
                    )}
                  </Button>
                  <Button
                    type="submit"
                    data-ocid="register.verify_button"
                    disabled={
                      verifyMutation.isPending || code.trim().length === 0
                    }
                    className="h-11 rounded-lg bg-accent px-6 text-accent-foreground shadow-subtle transition-smooth hover:bg-accent/90 hover:shadow-elevated"
                  >
                    {verifyMutation.isPending ? (
                      <>
                        <Loader2
                          className="size-4 animate-spin"
                          aria-hidden="true"
                        />
                        {t.register.verifying}
                      </>
                    ) : (
                      t.register.verify
                    )}
                  </Button>
                </div>
              </div>
            </form>
          ) : null}

          {step === 3 ? (
            <div
              data-ocid="register.success_state"
              className="flex flex-col items-center gap-4 py-6 text-center"
            >
              <span className="flex size-14 items-center justify-center rounded-xl bg-success/10 text-success-foreground">
                <BadgeCheck className="size-7" aria-hidden="true" />
              </span>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                {t.register.successTitle}
              </h2>
              <p className="max-w-md text-base leading-relaxed text-muted-foreground">
                {t.register.successBody}
              </p>
              <Button
                type="button"
                data-ocid="register.go_to_appointments_button"
                onClick={() => void navigate({ to: "/appointments" })}
                className="mt-2 h-11 rounded-lg bg-accent px-6 text-accent-foreground shadow-subtle transition-smooth hover:bg-accent/90 hover:shadow-elevated"
              >
                {t.register.goToDashboard}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t.register.alreadyRegistered}{" "}
        <Link
          to="/signin"
          data-ocid="register.signin_link"
          className="font-medium text-accent underline-offset-4 hover:underline"
        >
          {t.register.signInInstead}
        </Link>
      </p>
    </div>
  );
}
