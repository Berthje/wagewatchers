"use client";

import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

interface ActiveFilter {
  id: string;
  label: string;
  value: string;
  category:
    | "country"
    | "city"
    | "sector"
    | "age"
    | "workExperience"
    | "grossSalary"
    | "netSalary"
    | "columnsReset";
} 

interface ActiveFiltersDisplayProps {
  filters: ActiveFilter[];
  onRemoveFilter: (id: string, category: string) => void;
  onClearAll: () => void;
}

export function ActiveFiltersDisplay({
  filters,
  onRemoveFilter,
  onClearAll,
}: Readonly<ActiveFiltersDisplayProps>) {
  const t = useTranslations("dashboard");

  if (filters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-stone-400">{t("filters.activeFiltersLabel")}:</span>
      {filters.map((filter) => (
        <Badge
          key={filter.id}
          variant="secondary"
          className="pl-3 pr-2 py-1.5 gap-1.5 bg-stone-700 text-stone-200 hover:bg-stone-600 border border-stone-600"
        >
          <span className="text-xs font-medium">{filter.label}</span>
          <button
            onClick={() => onRemoveFilter(filter.value, filter.category)}
            className="ml-1 hover:bg-stone-500 rounded-full p-0.5 transition-colors"
            aria-label={`Remove ${filter.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {filters.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-xs text-stone-400 hover:text-stone-100 font-medium underline underline-offset-2"
        >
          {t("filters.clearAll")}
        </button>
      )}
    </div>
  );
}
