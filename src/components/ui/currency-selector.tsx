"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./select";
import { useTranslations } from "next-intl";

interface CurrencySelectorProps {
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    showFullLabel?: boolean;
}

const currencies = [
    { value: "EUR", labelKey: "nav.currencies.EUR", symbol: "€" },
    { value: "USD", labelKey: "nav.currencies.USD", symbol: "$" },
];

export function CurrencySelector({
    value,
    onValueChange,
    placeholder,
    className = "",
    disabled = false,
    showFullLabel = false,
}: Readonly<CurrencySelectorProps>) {
    const t = useTranslations();

    const selectedCurrency =
        currencies.find((c) => c.value === value) || currencies[0];

    return (
        <Select
            value={value}
            onValueChange={onValueChange}
            disabled={disabled}
        >
            <SelectTrigger
                className={`bg-stone-700 border-stone-600 text-stone-100 ${disabled ? "opacity-50" : ""} ${className}`}
            >
                <SelectValue placeholder={placeholder}>
                    {showFullLabel ? (
                        t(selectedCurrency.labelKey)
                    ) : (
                        <span className="text-lg">
                            {selectedCurrency.symbol}
                        </span>
                    )}
                </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-stone-700 border-stone-600">
                {currencies.map((curr) => (
                    <SelectItem
                        key={curr.value}
                        value={curr.value}
                        className="text-stone-100 focus:bg-stone-600"
                    >
                        {t(curr.labelKey)}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}