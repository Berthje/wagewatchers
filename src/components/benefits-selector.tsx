"use client";

import { useTranslations } from "next-intl";
import { getBenefitsFor, type BenefitDefinition } from "@/lib/benefits-catalog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface EntryBenefitValue {
  benefitKey: string;
  valueNumeric?: number;
  valueText?: string;
  currency?: string;
}

interface BenefitsSelectorProps {
  readonly country?: string;
  readonly workerType?: string;
  readonly currency?: string;
  readonly value: EntryBenefitValue[];
  readonly onChange: (next: EntryBenefitValue[]) => void;
  readonly currencySymbol?: string;
}

const CATEGORY_ORDER = [
  "cash",
  "equity",
  "insurance",
  "retirement",
  "mobility",
  "timeOff",
  "other",
] as const;

export function BenefitsSelector({
  country,
  workerType,
  currency = "EUR",
  value,
  onChange,
  currencySymbol = "€",
}: BenefitsSelectorProps) {
  const t = useTranslations("add");
  const available = getBenefitsFor(country, workerType);
  const byKey = new Map(value.map((v) => [v.benefitKey, v]));

  const toggle = (key: string, on: boolean) => {
    if (on) onChange([...value, { benefitKey: key, currency }]);
    else onChange(value.filter((v) => v.benefitKey !== key));
  };
  const patch = (key: string, p: Partial<EntryBenefitValue>) => {
    onChange(value.map((v) => (v.benefitKey === key ? { ...v, ...p } : v)));
  };

  // Group available benefits by category, preserving CATEGORY_ORDER.
  const groups = CATEGORY_ORDER.map((cat) => ({
    cat,
    items: available.filter((b) => b.category === cat),
  })).filter((g) => g.items.length > 0);

  const renderValueInput = (b: BenefitDefinition, cur: EntryBenefitValue | undefined) => {
    if (b.valueType === "boolean") return null;

    if (b.valueType === "amount" || b.valueType === "percent") {
      // Only true money amounts get the currency symbol. Day-count amounts
      // (e.g. extra leave / ADV days) and percentages do not.
      const CURRENCY_UNITS = ["perMonth", "perYear", "perDay"];
      const isMoney = b.valueType === "amount" && (!b.unit || CURRENCY_UNITS.includes(b.unit));
      const isPercent = b.valueType === "percent";
      return (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <div className="relative">
            {isMoney && (
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">
                {currencySymbol}
              </span>
            )}
            <Input
              type="number"
              min="0"
              step={isMoney ? "0.01" : "1"}
              placeholder={isPercent ? "%" : t("benefitsSelector.amountPlaceholder")}
              value={cur?.valueNumeric?.toString() ?? ""}
              onChange={(e) =>
                patch(b.key, {
                  valueNumeric: e.target.value ? Number.parseFloat(e.target.value) : undefined,
                })
              }
              className={cn("w-40 font-mono", isMoney && "pl-7", isPercent && "pr-7")}
            />
            {isPercent && (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">
                %
              </span>
            )}
          </div>
          {b.unit && (
            <span className="text-xs text-muted-foreground">{t(`benefitUnits.${b.unit}`)}</span>
          )}
          {b.detailHint && (
            <Input
              placeholder={t(`benefitDetails.${b.key}`)}
              value={cur?.valueText ?? ""}
              onChange={(e) => patch(b.key, { valueText: e.target.value })}
              className="min-w-[12rem] flex-1 text-sm"
            />
          )}
        </div>
      );
    }

    if (b.valueType === "enum") {
      return (
        <div className="mt-2">
          <Select
            value={cur?.valueText ?? ""}
            onValueChange={(v) => patch(b.key, { valueText: v })}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder={t("benefitsSelector.selectOption")} />
            </SelectTrigger>
            <SelectContent>
              {b.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {t(`benefitOptions.${b.key}.${opt}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    // text
    return (
      <div className="mt-2">
        <Input
          placeholder={t(`benefitDetails.${b.key}`)}
          value={cur?.valueText ?? ""}
          onChange={(e) => patch(b.key, { valueText: e.target.value })}
          className="text-sm"
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t("benefitsSelector.description")}</p>
      {groups.map((g) => (
        <div key={g.cat} className="space-y-3">
          <h4 className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            {t(`benefitCategories.${g.cat}`)}
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {g.items.map((b) => {
              const selected = byKey.has(b.key);
              const cur = byKey.get(b.key);
              return (
                <div
                  key={b.key}
                  className={cn(
                    "rounded-lg border p-3 transition-colors",
                    selected ? "border-brand/40 bg-brand/5" : "border-border bg-background"
                  )}
                >
                  <label className="flex cursor-pointer items-start gap-2.5">
                    <Checkbox
                      checked={selected}
                      onCheckedChange={(c) => toggle(b.key, !!c)}
                      className="mt-0.5"
                    />
                    <span className="text-sm font-medium text-foreground">
                      {t(`benefitsCatalog.${b.key}`)}
                    </span>
                  </label>
                  {selected && renderValueInput(b, cur)}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
