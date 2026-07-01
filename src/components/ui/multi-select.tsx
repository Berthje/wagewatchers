"use client";

import * as React from "react";
import { Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectTrigger } from "@/components/ui/select";

interface MultiSelectProps {
  options: { value: string; label: string }[];
  selectedValues: string[];
  onValuesChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  maxDisplay?: number;
  selectedLabel?: string; // e.g., "countries" or "sectors"
}

export function MultiSelect({
  options,
  selectedValues,
  onValuesChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  className,
  maxDisplay = 2,
  selectedLabel,
}: Readonly<MultiSelectProps>) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  const toggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onValuesChange(selectedValues.filter((v) => v !== value));
    } else {
      onValuesChange([...selectedValues, value]);
    }
  };

  const handleOpenChange = (open: boolean) => {
    // Prevent closing when search input is focused (mobile keyboard issue)
    if (!open && searchInputRef.current && document.activeElement === searchInputRef.current) {
      return;
    }
    setIsOpen(open);
  };

  return (
    <div className="relative w-full">
      <Select open={isOpen} onOpenChange={handleOpenChange}>
        <SelectTrigger
          className={cn("border-input bg-transparent text-foreground", className)}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-1 flex-wrap w-full">
            {selectedValues.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : selectedValues.length <= maxDisplay ? (
              selectedValues.map((value) => {
                const option = options.find((o) => o.value === value);
                return option ? (
                  <Badge
                    key={value}
                    variant="secondary"
                    className="mr-1 bg-secondary text-secondary-foreground"
                  >
                    {option.label}
                  </Badge>
                ) : null;
              })
            ) : (
              <span className="text-sm">
                {selectedValues.length} {selectedLabel || "selected"}
              </span>
            )}
          </div>
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          {/* Search Input */}
          <div className="flex items-center border-b border-border px-3 pb-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-muted-foreground" />
            <input
              ref={searchInputRef}
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={() => {}}
              onBlur={(e) => {
                // Small delay to allow option clicks to register
                setTimeout(() => {
                  if (
                    !searchInputRef.current ||
                    document.activeElement !== searchInputRef.current
                  ) {
                    // Only close if we're not still focused on search and not clicking an option
                    const activeElement = document.activeElement;
                    const isClickingOption =
                      activeElement && activeElement.closest("[data-radix-select-item]");
                    if (!isClickingOption) {
                      setIsOpen(false);
                    }
                  }
                }, 150);
              }}
              className="flex h-8 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground"
            />
            {searchQuery && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery("");
                }}
                className="ml-2 hover:bg-accent rounded p-1"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-[300px] overflow-y-auto p-1 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <div
                    key={option.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOption(option.value);
                    }}
                    className="flex items-center px-2 py-2 cursor-pointer hover:bg-accent rounded text-foreground transition-colors"
                  >
                    <div
                      className={cn(
                        "mr-2 h-4 w-4 border rounded flex items-center justify-center",
                        isSelected ? "bg-primary border-primary" : "border-input"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    {option.label}
                  </div>
                );
              })
            )}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}
