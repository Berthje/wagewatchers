"use client";

import { cn } from "@/lib/utils";

export interface SegmentedOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentedOption[];
  value?: string;
  onValueChange: (value: string) => void;
  /** Stretch segments to fill the row. Default false (intrinsic width). */
  fullWidth?: boolean;
  className?: string;
  "aria-label"?: string;
}

/**
 * A pill-style segmented control — the "selected = brand-filled pill" idiom used
 * for yes/no toggles across the app (add form booleans, filters modal). Extracted
 * so the pattern stops being copy-pasted.
 */
export function SegmentedControl({
  options,
  value,
  onValueChange,
  fullWidth = false,
  className,
  "aria-label": ariaLabel,
}: SegmentedControlProps) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex rounded-lg border border-input p-0.5",
        fullWidth && "flex w-full",
        className
      )}
    >
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "rounded-md px-5 py-1.5 text-sm font-medium transition-colors",
              fullWidth && "flex-1",
              selected
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
