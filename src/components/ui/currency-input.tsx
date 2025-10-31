"use client";

import { Input } from "./input";
import { CurrencySelector } from "./currency-selector";

interface CurrencyInputProps {
    value: number | string | undefined;
    onChange: (value: number | undefined) => void;
    currency: string;
    onCurrencyChange: (currency: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

const currencies = [
    { value: "EUR", label: "€", symbol: "€" },
    { value: "USD", label: "$", symbol: "$" },
];

export function CurrencyInput({
    value,
    onChange,
    currency,
    onCurrencyChange,
    placeholder,
    className = "",
    disabled = false,
}: Readonly<CurrencyInputProps>) {
    return (
        <div className="flex gap-2">
            {/* Currency Selector */}
            <CurrencySelector
                value={currency}
                onValueChange={onCurrencyChange}
                disabled={disabled}
                className="w-fit"
            />

            {/* Number Input */}
            <Input
                type="number"
                min="0"
                placeholder={placeholder}
                className={`flex-1 bg-stone-700 border-stone-600 text-stone-100 placeholder:text-stone-400 ${className}`}
                value={value?.toString() || ""}
                onChange={(e) =>
                    onChange(
                        e.target.value ? Number.parseFloat(e.target.value) : undefined
                    )
                }
                disabled={disabled}
            />
        </div>
    );
}
