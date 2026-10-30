import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { type LanguageCode, languageCodes } from "@/i18n";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, ShieldCheck, UserRound, Zap } from "lucide-react";
import { useState } from "react";

const nativeLabels: Record<LanguageCode, string> = {
  en: "English",
  ar: "العربية",
  ku: "کوردیی سۆرانی",
};

export function Header() {
  const { t, language, setLanguage } = useLanguage();
  const { isAuthenticated, isAdmin, login, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: "/", label: t.nav.home },
    { to: "/services", label: t.nav.services },
    { to: "/locations", label: t.nav.locations },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-primary/20 bg-primary text-primary-foreground">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:h-20 md:px-6">
        <Link
          to="/"
          data-ocid="header.home_link"
          className="flex min-w-0 items-center gap-3"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground shadow-subtle">
            <Zap className="size-5" aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-display text-sm font-semibold leading-tight tracking-tight md:text-base">
              {t.meta.appName}
            </span>
            <span className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-primary-foreground/60">
              {t.meta.tagline}
            </span>
          </span>
        </Link>

        <nav
          aria-label={t.nav.menu}
          className="hidden items-center gap-1 lg:flex"
        >
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              data-ocid={`header.nav.${link.to === "/" ? "home" : link.to.slice(1)}`}
              activeOptions={{ exact: link.to === "/" }}
              className="rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/80 transition-smooth hover:bg-primary-foreground/10 hover:text-primary-foreground"
              activeProps={{
                className:
                  "rounded-md px-3 py-2 text-sm font-medium bg-primary-foreground/10 text-primary-foreground",
              }}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin ? (
            <Link
              to="/admin"
              data-ocid="header.nav.admin"
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/80 transition-smooth hover:bg-primary-foreground/10 hover:text-primary-foreground"
              activeProps={{
                className:
                  "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium bg-primary-foreground/10 text-primary-foreground",
              }}
            >
              <ShieldCheck className="size-4" aria-hidden="true" />
              {t.nav.admin}
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                data-ocid="header.language_button"
                className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <span className="font-mono text-xs uppercase tracking-wider">
                  {language}
                </span>
                <span className="hidden sm:inline">
                  {nativeLabels[language]}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{t.language.switch}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {languageCodes.map((code) => (
                <DropdownMenuItem
                  key={code}
                  data-ocid={`header.language_option.${code}`}
                  onSelect={() => setLanguage(code)}
                  className={cn(
                    "justify-between",
                    code === language && "font-semibold text-accent",
                  )}
                >
                  <span>{nativeLabels[code]}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {code}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {isAuthenticated ? (
            <Button
              asChild
              variant="ghost"
              size="sm"
              data-ocid="header.profile_button"
              className="hidden text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground sm:inline-flex"
            >
              <Link to="/profile">
                <UserRound className="size-4" aria-hidden="true" />
                {t.profile.title}
              </Link>
            </Button>
          ) : null}

          {isAuthenticated ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-ocid="header.signout_button"
              onClick={() => {
                logout();
                void navigate({ to: "/" });
              }}
              className="hidden text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground sm:inline-flex"
            >
              {t.nav.signOut}
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-ocid="header.signin_button"
              onClick={login}
              className="hidden text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground sm:inline-flex"
            >
              {t.nav.signIn}
            </Button>
          )}

          <Button
            asChild
            size="sm"
            data-ocid="header.book_button"
            className="hidden rounded-lg bg-accent text-accent-foreground shadow-subtle transition-smooth hover:bg-accent/90 hover:shadow-elevated md:inline-flex"
          >
            <Link to="/book" search={{ service: undefined }}>
              {t.nav.book}
            </Link>
          </Button>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t.nav.menu}
                data-ocid="header.menu_button"
                className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground lg:hidden"
              >
                <Menu className="size-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="font-display">
                  {t.meta.appName}
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    data-ocid={`header.mobile_nav.${link.to === "/" ? "home" : link.to.slice(1)}`}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition-smooth hover:bg-muted"
                  >
                    {link.label}
                  </Link>
                ))}
                {isAdmin ? (
                  <Link
                    to="/admin"
                    data-ocid="header.mobile_nav.admin"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition-smooth hover:bg-muted"
                  >
                    <ShieldCheck className="size-4" aria-hidden="true" />
                    {t.nav.admin}
                  </Link>
                ) : null}
                <Link
                  to="/appointments"
                  data-ocid="header.mobile_nav.appointments"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition-smooth hover:bg-muted"
                >
                  {t.nav.myAppointments}
                </Link>
                {isAuthenticated ? (
                  <Link
                    to="/profile"
                    data-ocid="header.mobile_nav.profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition-smooth hover:bg-muted"
                  >
                    <UserRound className="size-4" aria-hidden="true" />
                    {t.profile.title}
                  </Link>
                ) : null}
                <div className="mt-3 flex flex-col gap-2">
                  <Button
                    asChild
                    data-ocid="header.mobile_book_button"
                    className="rounded-lg bg-accent text-accent-foreground"
                  >
                    <Link
                      to="/book"
                      search={{ service: undefined }}
                      onClick={() => setMobileOpen(false)}
                    >
                      {t.nav.book}
                    </Link>
                  </Button>
                  {isAuthenticated ? (
                    <Button
                      type="button"
                      variant="outline"
                      data-ocid="header.mobile_signout_button"
                      onClick={() => {
                        logout();
                        setMobileOpen(false);
                        void navigate({ to: "/" });
                      }}
                    >
                      {t.nav.signOut}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      data-ocid="header.mobile_signin_button"
                      onClick={() => {
                        login();
                        setMobileOpen(false);
                      }}
                    >
                      {t.nav.signIn}
                    </Button>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <div className="voltage-rail" aria-hidden="true" />
    </header>
  );
}
