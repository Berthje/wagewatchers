"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface CardRadioOption {
  value: string;
  label: string;
  /** Optional one-line hint shown under the label. */
  description?: string;
  /** Optional leading glyph (lucide icon, emoji, etc.). */
  icon?: ReactNode;
}

interface CardRadioGroupProps {
  options: CardRadioOption[];
  value?: string;
  onValueChange: (value: string) => void;
  /** Columns at the md breakpoint. Single column on mobile. Default 2. */
  columns?: 2 | 3;
  className?: string;
  "aria-label"?: string;
}

// Column classes are spelled out so Tailwind keeps them in the build.
const COLUMN_CLASS: Record<2 | 3, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 md:grid-cols-3",
};

/**
 * A radio group rendered as selectable cards, matching the app's "selected =
 * brand-tinted border" idiom (see feedback/donate). Use for the few high-impact
 * categorical choices (worker type, education, contract) — not long lists.
 */
export function CardRadioGroup({
  options,
  value,
  onValueChange,
  columns = 2,
  className,
  "aria-label": ariaLabel,
}: CardRadioGroupProps) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("grid grid-cols-1 gap-3", COLUMN_CLASS[columns], className)}>
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "w-full cursor-pointer rounded-xl border p-4 text-left transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
              isSelected
                ? "border-brand bg-brand/10 shadow-sm"
                : "border-border bg-card/60 hover:border-foreground/20 hover:bg-accent"
            )}
          >
            <div className={cn("flex items-center gap-3", option.description && "mb-1.5")}>
              {option.icon != null && (
                <span
                  className={cn(
                    "flex shrink-0 items-center justify-center text-lg leading-none",
                    isSelected ? "text-brand" : "text-muted-foreground"
                  )}
                >
                  {option.icon}
                </span>
              )}
              <span className="font-medium text-foreground">{option.label}</span>
            </div>
            {option.description && (
              <p className="text-sm text-muted-foreground">{option.description}</p>
            )}
          </button>
        );
      })}
    </div>
  );
}
