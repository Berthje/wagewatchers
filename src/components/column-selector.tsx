"use client";

import React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, RotateCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSalaryDisplay } from "@/contexts/salary-display-context";
import {
  AVAILABLE_COLUMNS,
  MAX_VISIBLE_COLUMNS,
  DEFAULT_SELECTED_COLUMNS,
} from "@/lib/columns-config";

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
    setSelectedColumns(DEFAULT_SELECTED_COLUMNS);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Eye className="h-4 w-4 mr-2" />
          {t("table.columns.button")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] bg-popover border-border py-3 px-4">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-md font-semibold text-foreground">{t("columns.title")}</h4>
          <div className="text-xs text-muted-foreground">
            {t("table.columns.selectedCount", { count: selectedColumns.length })}
          </div>
        </div>
        <div className="text-xs text-muted-foreground mb-2">
          {t("table.columns.maxReachedHelper", { max: MAX_VISIBLE_COLUMNS })}
        </div>

        <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2">
          {AVAILABLE_COLUMNS.map((col) => {
            const isChecked = selectedSet.has(col.key);
            const disabled = !isChecked && selectedColumns.length >= MAX_VISIBLE_COLUMNS;
            return (
              <label
                key={col.key}
                className={`flex items-center gap-2 text-sm ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => !disabled && toggle(col.key)}
                />
                <span className="text-foreground text-sm">{t(col.labelKey)}</span>
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
            title={
              isDefault
                ? t("table.columns.resetDisabledTitle", {
                    defaultValue: "Already using default columns",
                  })
                : undefined
            }
            className={`text-xs text-foreground bg-muted hover:bg-accent ${isDefault ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <RotateCw className="mr-2 h-4 w-4" />
            {t("table.columns.reset")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
