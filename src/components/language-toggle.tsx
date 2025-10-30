"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { locales } from "../i18n";

export function LanguageToggle() {
    const t = useTranslations("language");
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const switchLocale = (newLocale: string) => {
        const pathnameWithoutLocale =
            pathname.replace(/^\/(en|nl|fr|de)/, "") || "/";

        // Preserve existing search parameters
        const params = searchParams.toString();
        const queryString = params ? `?${params}` : "";

        const newPath = `/${newLocale}${pathnameWithoutLocale}${queryString}`;
        router.push(newPath);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Languages className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">{t("toggle")}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {locales.map((localeCode) => (
                    <DropdownMenuItem
                        key={localeCode}
                        onClick={() => switchLocale(localeCode)}
                        className={locale === localeCode ? "bg-accent" : ""}
                    >
                        {t(
                            localeCode === "en"
                                ? "english"
                                : localeCode === "nl"
                                    ? "dutch"
                                    : localeCode === "fr"
                                        ? "french"
                                        : "german"
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
