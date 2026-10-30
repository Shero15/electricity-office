import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Link } from "@tanstack/react-router";
import { Loader2, Lock, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

function CenteredPanel({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      {children}
    </div>
  );
}

export function ProtectedRoute({
  children,
  requiredRole = "user",
}: {
  children: ReactNode;
  requiredRole?: "user" | "admin";
}) {
  const { t } = useLanguage();
  const {
    isAuthenticated,
    isInitializing,
    isLoggingIn,
    isAdmin,
    isAdminLoading,
    login,
  } = useAuth();

  if (isInitializing) {
    return (
      <CenteredPanel>
        <Loader2
          className="size-8 animate-spin text-accent"
          aria-hidden="true"
        />
        <p
          data-ocid="protected.loading_state"
          className="mt-4 text-sm text-muted-foreground"
        >
          {t.common.loading}
        </p>
      </CenteredPanel>
    );
  }

  if (!isAuthenticated) {
    return (
      <CenteredPanel>
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
          data-ocid="protected.signin_button"
          onClick={login}
          disabled={isLoggingIn}
          className="mt-6 h-11 rounded-lg bg-accent px-6 text-accent-foreground shadow-subtle transition-smooth hover:bg-accent/90 hover:shadow-elevated"
        >
          {isLoggingIn ? t.auth.signingIn : t.auth.signInButton}
        </Button>
        <Button
          asChild
          variant="ghost"
          data-ocid="protected.back_home_button"
          className="mt-2"
        >
          <Link to="/">{t.auth.backHome}</Link>
        </Button>
      </CenteredPanel>
    );
  }

  if (requiredRole === "admin") {
    if (isAdminLoading) {
      return (
        <CenteredPanel>
          <Loader2
            className="size-8 animate-spin text-accent"
            aria-hidden="true"
          />
          <p
            data-ocid="protected.admin_loading_state"
            className="mt-4 text-sm text-muted-foreground"
          >
            {t.common.loading}
          </p>
        </CenteredPanel>
      );
    }
    if (!isAdmin) {
      return (
        <CenteredPanel>
          <span className="flex size-14 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <ShieldAlert className="size-7" aria-hidden="true" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight text-foreground">
            {t.auth.adminRequiredTitle}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            {t.auth.adminRequiredBody}
          </p>
          <Button
            asChild
            variant="outline"
            data-ocid="protected.admin_back_home_button"
            className="mt-6"
          >
            <Link to="/">{t.auth.backHome}</Link>
          </Button>
        </CenteredPanel>
      );
    }
  }

  return <>{children}</>;
}
