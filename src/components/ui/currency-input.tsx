"use client";

import { Input } from "./input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./select";

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
    const selectedCurrency =
        currencies.find((c) => c.value === currency) || currencies[0];

    return (
        <div className="flex gap-2">
            {/* Currency Selector */}
            <Select
                value={currency}
                onValueChange={onCurrencyChange}
                disabled={disabled}
            >
                <SelectTrigger
                    className={`w-fit bg-stone-700 border-stone-600 text-stone-100 ${disabled ? "opacity-50" : ""}`}
                >
                    <SelectValue>
                        <span className="text-lg">
                            {selectedCurrency.symbol}
                        </span>
                    </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-stone-700 border-stone-600">
                    {currencies.map((curr) => (
                        <SelectItem
                            key={curr.value}
                            value={curr.value}
                            className="text-stone-100 focus:bg-stone-600"
                        >
                            <span className="flex items-center gap-2">
                                <span className="text-lg">{curr.symbol}</span>
                                <span>{curr.value}</span>
                            </span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

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
