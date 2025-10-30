"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { getCitySuggestions, CitySuggestion } from "@/lib/location-matcher";
import { MapPin, CheckCircle2 } from "lucide-react";

interface SmartCityInputProps {
    value: string;
    onChange: (value: string) => void;
    location?: string;
    locale?: string;
    placeholder?: string;
    className?: string;
}

export function SmartCityInput({
    value,
    onChange,
    location,
    locale = "en",
    placeholder = "e.g. Brussels",
    className = "",
}: Readonly<SmartCityInputProps>) {
    const [inputValue, setInputValue] = useState(value || "");
    const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setInputValue(value || "");
    }, [value]);

    useEffect(() => {
        // Get suggestions when input changes
        if (inputValue && inputValue.length >= 2) {
            const citySuggestions = getCitySuggestions(
                inputValue,
                location,
                locale,
                0.5
            );
            setSuggestions(citySuggestions);
            setShowSuggestions(citySuggestions.length > 0);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [inputValue, location, locale]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        onChange(newValue);
        setHighlightedIndex(-1);
    };

    const handleSuggestionClick = (city: string) => {
        setInputValue(city);
        onChange(city);
        setShowSuggestions(false);
        setSuggestions([]);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions || suggestions.length === 0) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case "ArrowUp":
                e.preventDefault();
                setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                break;
            case "Enter":
                if (highlightedIndex >= 0) {
                    e.preventDefault();
                    handleSuggestionClick(suggestions[highlightedIndex].city);
                }
                break;
            case "Escape":
                setShowSuggestions(false);
                break;
        }
    };

    const handleBlur = () => {
        // Delay hiding suggestions to allow click events to fire
        setTimeout(() => {
            setShowSuggestions(false);
        }, 200);
    };

    const handleFocus = () => {
        if (inputValue && suggestions.length > 0) {
            setShowSuggestions(true);
        }
    };

    return (
        <div className="relative">
            <div className="relative">
                <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    placeholder={placeholder}
                    className={className}
                />
                {inputValue &&
                    suggestions.length > 0 &&
                    suggestions[0].isExactMatch && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <div
                    ref={suggestionsRef}
                    className="absolute z-50 w-full mt-1 bg-stone-700 border border-stone-600 rounded-md shadow-lg max-h-60 overflow-auto"
                >
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={suggestion.city}
                            type="button"
                            onClick={() =>
                                handleSuggestionClick(suggestion.city)
                            }
                            className={`w-full px-3 py-2 text-left hover:bg-stone-600 flex items-center justify-between transition-colors ${index === highlightedIndex
                                    ? "bg-stone-600"
                                    : ""
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-stone-500" />
                                <span className="text-sm text-stone-100">
                                    {suggestion.city}
                                </span>
                            </div>
                            {suggestion.isExactMatch && (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                            {!suggestion.isExactMatch &&
                                suggestion.score > 0.8 && (
                                    <span className="text-xs text-stone-400">
                                        Did you mean?
                                    </span>
                                )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
