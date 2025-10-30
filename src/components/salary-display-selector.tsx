"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
    useSalaryDisplay,
    type DisplayCurrency,
    type SalaryPeriod,
} from "@/contexts/salary-display-context";
import { useTranslations } from "next-intl";

const CURRENCIES: { value: DisplayCurrency; label: string; symbol: string }[] = [
    { value: "EUR", label: "nav.currencies.EUR", symbol: "€" },
    { value: "USD", label: "nav.currencies.USD", symbol: "$" },
    { value: "GBP", label: "nav.currencies.GBP", symbol: "£" },
];

const PERIODS: { value: SalaryPeriod; label: string }[] = [
    { value: "monthly", label: "nav.monthly" },
    { value: "annual", label: "nav.annual" },
];

export function SalaryDisplaySelector() {
    const { preferences, setCurrency, setPeriod } = useSalaryDisplay();
    const t = useTranslations();

    const currentCurrency = CURRENCIES.find(
        (c) => c.value === preferences.currency
    );
    const currentPeriod = PERIODS.find((p) => p.value === preferences.period);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 h-9"
                >
                    <span className="hidden sm:inline">
                        {currentCurrency?.symbol} • {t(currentPeriod?.label || 'nav.monthly')}
                    </span>
                    <span className="sm:hidden">
                        {currentCurrency?.symbol}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs font-normal text-stone-400">
                    {t("nav.currency")}
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup
                    value={preferences.currency}
                    onValueChange={(value) =>
                        setCurrency(value as DisplayCurrency)
                    }
                >
                    {CURRENCIES.map((currency) => (
                        <DropdownMenuRadioItem
                            key={currency.value}
                            value={currency.value}
                        >
                            {t(currency.label)}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>

                <DropdownMenuSeparator />

                <DropdownMenuLabel className="text-xs font-normal text-stone-400">
                    {t("nav.period")}
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup
                    value={preferences.period}
                    onValueChange={(value) => setPeriod(value as SalaryPeriod)}
                >
                    {PERIODS.map((period) => (
                        <DropdownMenuRadioItem
                            key={period.value}
                            value={period.value}
                        >
                            {t(period.label)}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
