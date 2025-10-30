"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface ComboboxProps extends React.ComponentPropsWithoutRef<"div"> {
    options: { value: string; label: string }[];
    value?: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    allowCustom?: boolean;
    className?: string;
}

export function Combobox({
    options,
    value,
    onValueChange,
    placeholder = "Select option...",
    allowCustom = false,
    className,
    ...props
}: Readonly<ComboboxProps>) {
    const [mode, setMode] = React.useState<"select" | "custom">(
        value && !options.some((o) => o.value === value) ? "custom" : "select"
    );

    // Check if current value is a custom value (not in options)
    const isCustomValue = value && !options.some((o) => o.value === value);

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <div className="flex-1">
                    {mode === "select" ? (
                        <Select value={value} onValueChange={onValueChange}>
                            <SelectTrigger
                                className={className}
                                aria-invalid={props["aria-invalid"]}
                            >
                                <SelectValue placeholder={placeholder} />
                            </SelectTrigger>
                            <SelectContent className="bg-stone-700 border-stone-600">
                                {options.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                        className="text-stone-100 focus:bg-stone-600"
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <Input
                            value={value || ""}
                            onChange={(e) => onValueChange(e.target.value)}
                            placeholder={placeholder}
                            className={className}
                            aria-invalid={props["aria-invalid"]}
                        />
                    )}
                </div>
                {allowCustom && (
                    <button
                        type="button"
                        onClick={() => {
                            setMode(mode === "select" ? "custom" : "select");
                            if (mode === "custom") {
                                onValueChange("");
                            }
                        }}
                        className="px-2 cursor-pointer text-sm bg-stone-700 border-stone-600 rounded-md hover:bg-stone-600 transition-colors whitespace-nowrap"
                        aria-label={
                            mode === "select"
                                ? "Switch to custom input"
                                : "Switch to select"
                        }
                    >
                        {mode === "select" ? "✏️" : "📋"}
                    </button>
                )}
            </div>
            {isCustomValue && mode === "select" && (
                <p className="text-xs text-stone-400">
                    Custom value: {value}
                </p>
            )}
        </div>
    );
}
