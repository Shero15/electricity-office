import { useLanguage } from "@/context/LanguageContext";
import { Link } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone, Zap } from "lucide-react";

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-primary text-primary-foreground">
      <div className="voltage-rail" aria-hidden="true" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-3 md:px-6 md:py-16">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Zap className="size-5" aria-hidden="true" />
            </span>
            <span className="font-display text-base font-semibold tracking-tight">
              {t.meta.appName}
            </span>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-primary-foreground/70">
            {t.footer.aboutBody}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/60">
            {t.footer.contactTitle}
          </h3>
          <ul className="flex flex-col gap-3 text-sm text-primary-foreground/80">
            <li className="flex items-center gap-2.5">
              <Phone
                className="size-4 shrink-0 text-accent"
                aria-hidden="true"
              />
              <span dir="ltr">+964 770 000 0000</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail
                className="size-4 shrink-0 text-accent"
                aria-hidden="true"
              />
              <span dir="ltr">info@electricity-office.gov</span>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin
                className="mt-0.5 size-4 shrink-0 text-accent"
                aria-hidden="true"
              />
              <span>{t.home.address}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Clock
                className="size-4 shrink-0 text-accent"
                aria-hidden="true"
              />
              <span>{t.home.hoursValue}</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/60">
            {t.footer.linksTitle}
          </h3>
          <ul className="flex flex-col gap-2.5 text-sm">
            <li>
              <Link
                to="/services"
                data-ocid="footer.link.services"
                className="text-primary-foreground/80 transition-smooth hover:text-accent"
              >
                {t.nav.services}
              </Link>
            </li>
            <li>
              <Link
                to="/locations"
                data-ocid="footer.link.locations"
                className="text-primary-foreground/80 transition-smooth hover:text-accent"
              >
                {t.nav.locations}
              </Link>
            </li>
            <li>
              <Link
                to="/book"
                search={{ service: undefined }}
                data-ocid="footer.link.book"
                className="text-primary-foreground/80 transition-smooth hover:text-accent"
              >
                {t.nav.book}
              </Link>
            </li>
            <li>
              <Link
                to="/appointments"
                data-ocid="footer.link.appointments"
                className="text-primary-foreground/80 transition-smooth hover:text-accent"
              >
                {t.nav.myAppointments}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-primary-foreground/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-primary-foreground/60 md:flex-row md:px-6">
          <p>
            © {year} {t.meta.appName}. {t.footer.rights}
          </p>
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="transition-smooth hover:text-accent"
          >
            © {year}. Built with love using caffeine.ai
          </a>
        </div>
      </div>
    </footer>
  );
}
