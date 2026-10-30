import { createActor } from "@/backend";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Fingerprint,
  KeyRound,
  Loader2,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

type Mode = "signin" | "recovery";

export function SignInPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const { isAuthenticated, isInitializing, isLoggingIn, isLoginError, login } =
    useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [recoveryPhone, setRecoveryPhone] = useState("");
  const [recoveryToken, setRecoveryToken] = useState("");
  const [recoveryRequested, setRecoveryRequested] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && mode === "signin") {
      void navigate({ to: "/appointments" });
    }
  }, [isAuthenticated, mode, navigate]);

  const startRecoveryMutation = useMutation({
    mutationFn: async (phone: string) => {
      if (!actor) throw new Error("internal");
      const result = await actor.startAccountRecovery(phone);
      if (result.__kind__ === "err") throw new Error(result.err.__kind__);
      return true;
    },
  });

  const completeRecoveryMutation = useMutation({
    mutationFn: async (args: { phone: string; token: string }) => {
      if (!actor) throw new Error("internal");
      const result = await actor.completeAccountRecovery(
        args.phone,
        args.token,
      );
      if (result.__kind__ === "err") throw new Error(result.err.__kind__);
      return result.ok;
    },
  });

  function handleStartRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRecoveryError(null);
    if (recoveryPhone.replace(/\D/g, "").length < 6) {
      setRecoveryError(t.register.errorInvalidInput);
      return;
    }
    startRecoveryMutation.mutate(recoveryPhone.trim(), {
      onSuccess: () => setRecoveryRequested(true),
      onError: () => setRecoveryError(t.auth.recoveryRequestError),
    });
  }

  function handleCompleteRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRecoveryError(null);
    if (recoveryToken.trim().length === 0) {
      setRecoveryError(t.auth.recoveryError);
      return;
    }
    completeRecoveryMutation.mutate(
      { phone: recoveryPhone.trim(), token: recoveryToken.trim() },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: ["myProfile"] });
          void queryClient.invalidateQueries({ queryKey: ["myDevices"] });
          void navigate({ to: "/appointments" });
        },
        onError: () => setRecoveryError(t.auth.recoveryError),
      },
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-16">
      <span className="flex size-14 items-center justify-center rounded-xl bg-accent/10 text-accent">
        <Fingerprint className="size-7" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-center font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
        {mode === "signin" ? t.auth.signInTitle : t.auth.recoveryTitle}
      </h1>
      <p className="mt-3 text-center text-base leading-relaxed text-muted-foreground">
        {mode === "signin" ? t.auth.signInBody : t.auth.recoveryBody}
      </p>

      {mode === "signin" ? (
        <>
          <Button
            type="button"
            data-ocid="signin.submit_button"
            onClick={login}
            disabled={isInitializing || isLoggingIn}
            className="mt-7 h-12 w-full rounded-lg bg-accent px-6 text-base text-accent-foreground shadow-subtle transition-smooth hover:bg-accent/90 hover:shadow-elevated"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {t.auth.signingIn}
              </>
            ) : (
              <>
                <ShieldCheck className="size-4" aria-hidden="true" />
                {t.auth.signInButton}
              </>
            )}
          </Button>

          {isLoginError ? (
            <p
              data-ocid="signin.error_state"
              role="alert"
              className="mt-4 w-full rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {t.auth.signInError}
            </p>
          ) : null}

          <div className="mt-6 flex w-full flex-col items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              data-ocid="signin.recovery_link"
              onClick={() => {
                setMode("recovery");
                setRecoveryError(null);
              }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              <KeyRound className="size-4" aria-hidden="true" />
              {t.auth.recoveryLink}
            </Button>
            <p className="text-sm text-muted-foreground">
              {t.auth.noAccount}{" "}
              <Link
                to="/register"
                data-ocid="signin.register_link"
                className="font-medium text-accent underline-offset-4 hover:underline"
              >
                {t.auth.registerLink}
              </Link>
            </p>
          </div>
        </>
      ) : (
        <Card className="mt-7 w-full rounded-lg border-border shadow-subtle">
          <CardContent className="pt-6">
            {!isAuthenticated ? (
              <div className="flex flex-col gap-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t.auth.requiredBody}
                </p>
                <Button
                  type="button"
                  data-ocid="signin.recovery_signin_button"
                  onClick={login}
                  disabled={isInitializing || isLoggingIn}
                  className="h-11 rounded-lg bg-accent px-6 text-accent-foreground shadow-subtle transition-smooth hover:bg-accent/90 hover:shadow-elevated"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                      {t.auth.signingIn}
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-4" aria-hidden="true" />
                      {t.auth.signInButton}
                    </>
                  )}
                </Button>
              </div>
            ) : !recoveryRequested ? (
              <form
                onSubmit={handleStartRecovery}
                className="flex flex-col gap-4"
                noValidate
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="recovery-phone">
                    {t.auth.recoveryPhoneLabel}
                  </Label>
                  <Input
                    id="recovery-phone"
                    data-ocid="signin.recovery_phone_input"
                    value={recoveryPhone}
                    onChange={(event) => setRecoveryPhone(event.target.value)}
                    placeholder={t.auth.recoveryPhonePlaceholder}
                    inputMode="tel"
                    autoComplete="tel"
                    dir="ltr"
                    className="h-11 rounded-lg"
                  />
                </div>
                {recoveryError ? (
                  <p
                    data-ocid="signin.recovery_error_state"
                    role="alert"
                    className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                  >
                    {recoveryError}
                  </p>
                ) : null}
                <Button
                  type="submit"
                  data-ocid="signin.recovery_send_button"
                  disabled={startRecoveryMutation.isPending}
                  className="h-11 rounded-lg bg-accent px-6 text-accent-foreground shadow-subtle transition-smooth hover:bg-accent/90 hover:shadow-elevated"
                >
                  {startRecoveryMutation.isPending ? (
                    <>
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                      {t.auth.recoverySending}
                    </>
                  ) : (
                    t.auth.recoveryButton
                  )}
                </Button>
              </form>
            ) : (
              <form
                onSubmit={handleCompleteRecovery}
                className="flex flex-col gap-4"
                noValidate
              >
                <p
                  data-ocid="signin.recovery_sent_state"
                  className="rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success-foreground"
                >
                  {t.auth.recoverySent}
                </p>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="recovery-token">
                    {t.auth.recoveryTokenLabel}
                  </Label>
                  <Input
                    id="recovery-token"
                    data-ocid="signin.recovery_token_input"
                    value={recoveryToken}
                    onChange={(event) => setRecoveryToken(event.target.value)}
                    placeholder={t.auth.recoveryTokenPlaceholder}
                    dir="ltr"
                    className="h-11 rounded-lg font-mono"
                  />
                </div>
                {recoveryError ? (
                  <p
                    data-ocid="signin.recovery_error_state"
                    role="alert"
                    className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                  >
                    {recoveryError}
                  </p>
                ) : null}
                <Button
                  type="submit"
                  data-ocid="signin.recovery_complete_button"
                  disabled={completeRecoveryMutation.isPending}
                  className="h-11 rounded-lg bg-accent px-6 text-accent-foreground shadow-subtle transition-smooth hover:bg-accent/90 hover:shadow-elevated"
                >
                  {completeRecoveryMutation.isPending ? (
                    <>
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                      {t.auth.recoveryCompleting}
                    </>
                  ) : (
                    t.auth.recoveryComplete
                  )}
                </Button>
              </form>
            )}

            <Button
              type="button"
              variant="ghost"
              data-ocid="signin.recovery_back_button"
              onClick={() => {
                setMode("signin");
                setRecoveryError(null);
                setRecoveryRequested(false);
              }}
              className="mt-4 w-full"
            >
              <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
              {t.auth.recoveryBackToSignIn}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        <Zap className="size-3.5 text-accent" aria-hidden="true" />
        <span>{t.meta.appName}</span>
      </div>

      <Button
        asChild
        variant="ghost"
        data-ocid="signin.back_home_button"
        className="mt-4"
      >
        <Link to="/">{t.auth.backHome}</Link>
      </Button>
    </div>
  );
}
