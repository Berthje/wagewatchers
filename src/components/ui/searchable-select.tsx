"use client";

import * as React from "react";
import { Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface SearchableSelectProps {
    options: { value: string; label: string }[];
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    className?: string;
}

export function SearchableSelect({
    options,
    value,
    onValueChange,
    placeholder = "Select option...",
    searchPlaceholder = "Search...",
    emptyMessage = "No results found.",
    className,
}: Readonly<SearchableSelectProps>) {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [isOpen, setIsOpen] = React.useState(false);

    const selectedOption = options.find((option) => option.value === value);

    // Filter options based on search query
    const filteredOptions = React.useMemo(() => {
        if (!searchQuery) return options;
        return options.filter((option) =>
            option.label.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [options, searchQuery]);

    return (
        <div className="relative">
            <Select
                value={value}
                onValueChange={(val) => {
                    onValueChange(val);
                    setSearchQuery("");
                }}
                open={isOpen}
                onOpenChange={setIsOpen}
            >
                <SelectTrigger
                    className={cn(
                        "bg-stone-700 border-stone-600 text-stone-100",
                        className
                    )}
                >
                    <SelectValue placeholder={placeholder}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-stone-800 border-stone-600">
                    {/* Search Input */}
                    <div className="flex items-center border-b border-stone-600 px-3 pb-2">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-stone-400" />
                        <input
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="flex h-8 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-stone-400 text-stone-100"
                        />
                        {searchQuery && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSearchQuery("");
                                }}
                                className="ml-2 hover:bg-stone-600 rounded p-1"
                            >
                                <X className="h-3 w-3 text-stone-400" />
                            </button>
                        )}
                    </div>

                    {/* Options List */}
                    <div className="max-h-[300px] overflow-y-auto scrollbar-thin">
                        {filteredOptions.length === 0 ? (
                            <div className="py-6 text-center text-sm text-stone-400">
                                {emptyMessage}
                            </div>
                        ) : (
                            filteredOptions.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                    className="text-stone-100 focus:bg-stone-700"
                                >
                                    <div className="flex items-center">
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === option.value
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                            )}
                                        />
                                        {option.label}
                                    </div>
                                </SelectItem>
                            ))
                        )}
                    </div>
                </SelectContent>
            </Select>
        </div >
    );
}
