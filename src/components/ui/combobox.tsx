"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface ComboboxProps extends React.ComponentPropsWithoutRef<"div"> {
    options: { value: string; label: string }[];
    value?: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    allowCustom?: boolean;
    onSearchChange?: (search: string) => void;
    emptyMessage?: string;
    className?: string;
}

export function Combobox({
    options,
    value,
    onValueChange,
    placeholder,
    allowCustom = false,
    onSearchChange,
    emptyMessage,
    className,
    ...props
}: Readonly<ComboboxProps>) {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState("");
    const t = useTranslations("ui");

    const displayPlaceholder = placeholder || t("selectOption");

    // Update input value when value changes
    React.useEffect(() => {
        if (value) {
            const option = options.find((opt) => opt.value === value);
            setInputValue(option ? option.label : value);
        }
    }, [value, options]);

    const handleInputChange = (searchValue: string) => {
        setInputValue(searchValue);
        if (allowCustom) {
            onValueChange(searchValue);
        }
        if (onSearchChange) {
            onSearchChange(searchValue);
        }
    };

    const handleSelect = (selectedValue: string) => {
        const newValue = selectedValue === value ? "" : selectedValue;
        onValueChange(newValue);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between", className)}
                    aria-invalid={props["aria-invalid"]}
                >
                    {inputValue || displayPlaceholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-(--radix-popover-trigger-width) p-0 bg-stone-700 border-stone-600">
                <Command className="bg-stone-700">
                    <CommandInput
                        placeholder={t("searchOptions")}
                        className="bg-stone-700 border-stone-600 text-stone-100 placeholder:text-stone-400"
                        value={inputValue}
                        onValueChange={handleInputChange}
                    />
                    <CommandList>
                        <CommandEmpty>{emptyMessage || t("noOptionsFound")}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => handleSelect(option.value)}
                                    className="text-stone-100 hover:bg-stone-600"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
