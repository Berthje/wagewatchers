"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/language-toggle";
import { SalaryDisplaySelector } from "@/components/salary-display-selector";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface NavbarProps {
    locale: string;
    translations: {
        dashboard: string;
        statistics?: string;
        feedback: string;
        status: string;
        donate: string;
        addEntry: string;
    };
}

export function Navbar({ locale, translations }: Readonly<NavbarProps>) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const isActiveRoute = (href: string) => {
        // Exact match for dashboard
        if (href === `/${locale}/dashboard`) {
            return pathname === `/${locale}/dashboard`;
        }
        // For other routes, check if pathname starts with the href
        return pathname.startsWith(href);
    };

    const navLinks = [
        { href: `/${locale}/dashboard`, label: translations.dashboard },
        ...(translations.statistics
            ? [
                {
                    href: `/${locale}/statistics`,
                    label: translations.statistics,
                },
            ]
            : []),
        { href: `/${locale}/feedback`, label: translations.feedback },
        { href: `/${locale}/status`, label: translations.status },
        { href: `/${locale}/donate`, label: translations.donate },
    ];

    return (
        <header className="relative z-10 container mx-auto px-4 py-4">
            <nav className="flex items-center justify-between">
                {/* Logo */}
                <Link
                    href={`/${locale}`}
                    className="flex items-center space-x-2"
                >
                    <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center">
                        <span className="text-stone-900 font-bold text-sm">
                            WW
                        </span>
                    </div>
                    <span className="text-lg md:text-xl font-bold text-stone-100">
                        WageWatchers
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center space-x-1 lg:space-x-4">
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
                                            ? "text-stone-100 font-semibold bg-stone-800"
                                            : "text-stone-300 hover:text-stone-100"
                                    )}
                                    aria-current={isActive ? "page" : undefined}
                                >
                                    {link.label}
                                    {isActive && (
                                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-0.5 bg-stone-100 rounded-full" />
                                    )}
                                </Button>
                            </Link>
                        );
                    })}
                    <SalaryDisplaySelector />
                    <Link href={`/${locale}/add`}>
                        <Button
                            size="sm"
                            className={cn(
                                "px-4 transition-colors",
                                isActiveRoute(`/${locale}/add`)
                                    ? "bg-stone-200 text-stone-900 ring-2 ring-stone-100 ring-offset-2"
                                    : "bg-stone-100 hover:bg-stone-200 text-stone-900"
                            )}
                            aria-current={
                                isActiveRoute(`/${locale}/add`)
                                    ? "page"
                                    : undefined
                            }
                        >
                            {translations.addEntry}
                        </Button>
                    </Link>
                    <Suspense fallback={null}>
                        <LanguageToggle />
                    </Suspense>
                </div>

                {/* Mobile Navigation */}
                <div className="flex md:hidden items-center space-x-2">
                    <SalaryDisplaySelector />
                    <Suspense fallback={null}>
                        <LanguageToggle />
                    </Suspense>
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-stone-100"
                                aria-label="Toggle menu"
                            >
                                {isOpen ? (
                                    <X className="h-6 w-6" />
                                ) : (
                                    <Menu className="h-6 w-6" />
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent
                            side="right"
                            className="w-[280px] sm:w-[320px]"
                        >
                            <SheetHeader>
                                <SheetTitle className="text-left">
                                    Menu
                                </SheetTitle>
                            </SheetHeader>
                            <div className="flex flex-col space-y-3 mt-6">
                                {navLinks.map((link) => {
                                    const isActive = isActiveRoute(link.href);
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <Button
                                                variant="ghost"
                                                className={cn(
                                                    "w-full justify-start text-left text-base font-medium",
                                                    isActive
                                                        ? "text-stone-100 bg-stone-800 font-bold"
                                                        : "text-stone-300 hover:text-stone-100 hover:bg-stone-800"
                                                )}
                                                aria-current={
                                                    isActive
                                                        ? "page"
                                                        : undefined
                                                }
                                            >
                                                {link.label}
                                            </Button>
                                        </Link>
                                    );
                                })}
                                <Link
                                    href={`/${locale}/add`}
                                    onClick={() => setIsOpen(false)}
                                    className="pt-2"
                                >
                                    <Button
                                        className={cn(
                                            "w-full text-base font-medium",
                                            isActiveRoute(`/${locale}/add`)
                                                ? "bg-stone-200 text-stone-900 ring-2 ring-stone-100"
                                                : "bg-stone-100 hover:bg-stone-200 text-stone-900"
                                        )}
                                        aria-current={
                                            isActiveRoute(`/${locale}/add`)
                                                ? "page"
                                                : undefined
                                        }
                                    >
                                        {translations.addEntry}
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
