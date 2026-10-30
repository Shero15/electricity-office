import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";

export function NotFoundPage() {
  const { t } = useLanguage();
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-xl bg-accent/10 text-accent">
        <Compass className="size-7" aria-hidden="true" />
      </span>
      <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-foreground">
        404
      </h1>
      <p
        data-ocid="not_found.message"
        className="mt-3 text-base leading-relaxed text-muted-foreground"
      >
        {t.common.notFound}
      </p>
      <Button
        asChild
        data-ocid="not_found.home_button"
        className="mt-6 rounded-lg bg-accent text-accent-foreground transition-smooth hover:bg-accent/90"
      >
        <Link to="/">{t.auth.backHome}</Link>
      </Button>
    </div>
  );
}
