"use client";

import React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, RotateCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSalaryDisplay } from "@/contexts/salary-display-context";
import { AVAILABLE_COLUMNS, MAX_VISIBLE_COLUMNS, DEFAULT_SELECTED_COLUMNS } from "@/lib/columns-config";

export function ColumnSelector() {
  const t = useTranslations("dashboard");
  // Use nested table.columns keys for clarity and consistency

  const { selectedColumns, setSelectedColumns } = useSalaryDisplay();

  const selectedSet = new Set(selectedColumns);

  const toggle = (key: string) => {
    if (selectedSet.has(key)) {
      setSelectedColumns(selectedColumns.filter((c) => c !== key));
      return;
    }
    if (selectedColumns.length >= MAX_VISIBLE_COLUMNS) return;
    setSelectedColumns([...selectedColumns, key]);
  };

  const isDefault =
    selectedColumns.length === DEFAULT_SELECTED_COLUMNS.length &&
    selectedColumns.every((c, i) => c === DEFAULT_SELECTED_COLUMNS[i]);

  const resetToDefaults = () => {
    try {
      // dynamic import to avoid circular
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { DEFAULT_SELECTED_COLUMNS } = require("@/lib/columns-config");
      setSelectedColumns(DEFAULT_SELECTED_COLUMNS);
    } catch (error) {
      // fallback
      setSelectedColumns(["location", "jobTitle", "sector", "experience", "age", "grossSalary", "netSalary", "submittedOn"]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="bg-stone-800 border-stone-600 text-stone-100">
          <Eye className="h-4 w-4 mr-2" />
          {t("table.columns.button")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] bg-stone-800 border-stone-700 py-3 px-4">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-md font-semibold text-stone-100">{t("columns.title")}</h4>
          <div className="text-xs text-stone-400">{t("table.columns.selectedCount", { count: selectedColumns.length })}</div>
        </div>
        <div className="text-xs text-stone-400 mb-2">{t("table.columns.maxReachedHelper", { max: MAX_VISIBLE_COLUMNS })}</div>

        <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2">
          {AVAILABLE_COLUMNS.map((col) => {
            const isChecked = selectedSet.has(col.key);
            const disabled = !isChecked && selectedColumns.length >= MAX_VISIBLE_COLUMNS;
            return (
              <label
                key={col.key}
                className={`flex items-center gap-2 text-sm ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <Checkbox checked={isChecked} onCheckedChange={() => !disabled && toggle(col.key)} />
                <span className="text-stone-200 text-sm">{t(col.labelKey)}</span>
              </label>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetToDefaults}
            disabled={isDefault}
            title={isDefault ? t("table.columns.resetDisabledTitle", { defaultValue: "Already using default columns" }) : undefined}
            className={`text-xs text-stone-100 bg-stone-700 hover:bg-stone-600 ${isDefault ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <RotateCw className="mr-2 h-4 w-4" />
            {t("table.columns.reset")}
          </Button>

        </div>
      </PopoverContent>
    </Popover>
  );
}
