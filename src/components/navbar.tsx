"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { SalaryDisplaySelector } from "@/components/salary-display-selector";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useOpenPanel } from "@openpanel/nextjs";

interface NavbarTranslations {
  dashboard: string;
  statistics?: string;
  feedback: string;
  status: string;
  donate: string;
  addEntry: string;
  changelog: string;
}

interface NavbarProps {
  locale?: string;
  translations?: NavbarTranslations;
}

export function Navbar({ locale: localeProp, translations }: Readonly<NavbarProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const op = useOpenPanel();

  // Self-source locale + nav translations so callers can just render <Navbar />.
  // Props remain supported for backward compatibility (e.g. admin screens).
  const localeFromHook = useLocale();
  const t = useTranslations("nav");
  const locale = localeProp ?? localeFromHook;
  const tr: NavbarTranslations = translations ?? {
    dashboard: t("dashboard"),
    statistics: t("statistics"),
    feedback: t("feedback"),
    status: t("status"),
    donate: t("donate"),
    addEntry: t("addEntry"),
    changelog: t("changelog"),
  };

  const isActiveRoute = (href: string) => {
    if (href === `/${locale}/dashboard`) {
      return pathname === `/${locale}/dashboard`;
    }
    return pathname.startsWith(href);
  };

  const navLinks = [
    { href: `/${locale}/dashboard`, label: tr.dashboard },
    ...(tr.statistics ? [{ href: `/${locale}/statistics`, label: tr.statistics }] : []),
    { href: `/${locale}/feedback`, label: tr.feedback },
    { href: `/${locale}/status`, label: tr.status },
    { href: `/${locale}/changelog`, label: tr.changelog },
    { href: `/${locale}/donate`, label: tr.donate },
  ];

  return (
    <header className="relative z-20 mx-auto max-w-6xl px-6 py-4">
      <nav className="flex items-center justify-between">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
            <span className="text-sm font-bold text-background">WW</span>
          </div>
          <span className="text-lg font-bold text-foreground md:text-xl">WageWatchers</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center space-x-1 md:flex lg:space-x-2">
          {navLinks.map((link) => {
            const isActive = isActiveRoute(link.href);
            return (
              <Link key={link.href} href={link.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "relative transition-colors",
                    isActive
                      ? "bg-accent font-semibold text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() =>
                    op.track("nav_link_clicked", { link: link.label, location: "desktop" })
                  }
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 h-0.5 w-4/5 -translate-x-1/2 rounded-full bg-brand" />
                  )}
                </Button>
              </Link>
            );
          })}
          <SalaryDisplaySelector />
          <Link href={`/${locale}/add`}>
            <Button
              size="sm"
              className="px-4"
              aria-current={isActiveRoute(`/${locale}/add`) ? "page" : undefined}
              onClick={() => op.track("add_entry_clicked", { location: "desktop" })}
            >
              {tr.addEntry}
            </Button>
          </Link>
          <Suspense fallback={null}>
            <LanguageToggle />
          </Suspense>
          <ThemeToggle />
        </div>

        {/* Mobile Navigation */}
        <div className="flex items-center space-x-1 md:hidden">
          <SalaryDisplaySelector />
          <ThemeToggle />
          <Suspense fallback={null}>
            <LanguageToggle />
          </Suspense>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground"
                aria-label="Toggle menu"
                onClick={() =>
                  op.track("menu_toggle_clicked", { action: isOpen ? "close" : "open" })
                }
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px]">
              <SheetHeader>
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col space-y-3">
                {navLinks.map((link) => {
                  const isActive = isActiveRoute(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => {
                        setIsOpen(false);
                        op.track("nav_link_clicked", { link: link.label, location: "mobile" });
                      }}
                    >
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-left text-base font-medium",
                          isActive
                            ? "bg-accent font-semibold text-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {link.label}
                      </Button>
                    </Link>
                  );
                })}
                <Link
                  href={`/${locale}/add`}
                  onClick={() => {
                    setIsOpen(false);
                    op.track("add_entry_clicked", { location: "mobile" });
                  }}
                  className="pt-2"
                >
                  <Button
                    className="w-full text-base font-medium"
                    aria-current={isActiveRoute(`/${locale}/add`) ? "page" : undefined}
                  >
                    {tr.addEntry}
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
