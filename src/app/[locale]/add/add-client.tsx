"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { HelpCircle, ArrowLeft, Lock, MapPin, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Combobox } from "@/components/ui/combobox";
import { CityCombobox } from "@/components/ui/city-combobox";
import { CurrencySelector } from "@/components/ui/currency-selector";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import { PageShell } from "@/components/page-shell";
import { PageHeader } from "@/components/page-header";
import { getAllCountries, getFormConfigForCountry } from "@/lib/salary-config";
import { createFieldConfigs, getFieldConfigsForCountry } from "@/lib/field-configs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorPage } from "@/components/ui/error-page";
import {
  createSalaryEntrySchema,
  SalaryEntryFormData,
} from "@/lib/validations/salary-entry.schema";
import {
  getEntryToken,
  isEntryEditable,
  verifyOwnerToken,
  getEditTimeRemaining,
} from "@/lib/entry-ownership";
import { logError, logWarning } from "@/lib/logger";
import { BenefitsSelector, type EntryBenefitValue } from "@/components/benefits-selector";
import { getDegreesFor } from "@/lib/degrees-catalog";

// Fields that render with a currency prefix and store a float.
const MONEY_FIELDS = [
  "grossSalary",
  "netSalary",
  "netCompensation",
  "mealVouchers",
  "ecoCheques",
  "fixedGrossSalary",
  "variableGrossSalary",
  "hourlyRate",
  "dayRate",
  "clientDayBudget",
  "bursaryAmount",
  "virtualGrossSalary",
];

// Company-car detail fields only shown once "has company car" is selected.
const COMPANY_CAR_DETAIL_FIELDS = ["companyCarModel", "companyCarFuelType", "companyCarCardScope"];

// Contract types that make sense per worker type (Belgian context): freelancers
// work under a freelance agreement, interns under an internship, employees under
// permanent/fixed-term/interim, and PhD researchers under fixed-term mandates.
const CONTRACT_TYPES_BY_WORKER: Record<string, string[]> = {
  whiteCollar: ["permanent", "fixedTerm", "interim"],
  blueCollar: ["permanent", "fixedTerm", "interim"],
  freelancer: ["freelance"],
  intern: ["internship"],
  phdResearcher: ["fixedTerm", "permanent"],
};

// Utility function to clean commute distance by keeping only numbers and dashes
const cleanCommuteDistance = (value: string): string => {
  // Keep only numbers and dashes, remove all other characters
  return value.replace(/[^0-9-]/g, "").trim();
};

const getSubmitButtonText = (
  isSubmitting: boolean,
  isEditMode: boolean,
  t: (key: string) => string
) => {
  if (isSubmitting) {
    return isEditMode ? t("updatingEntry") : t("submittingEntry");
  }
  return isEditMode ? t("updateEntry") : t("submitEntry");
};

function AddEntryContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editEntryId, setEditEntryId] = useState<number | null>(null);
  const [editableUntil, setEditableUntil] = useState<string | null>(null);
  const [isLoadingEntry, setIsLoadingEntry] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<Date | null>(null);
  const [debouncedAlerts, setDebouncedAlerts] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<string>("location");
  const t = useTranslations("add");
  const tCommon = useTranslations("common");
  const tEdit = useTranslations("edit");
  const confettiRef = useRef<number | null>(null);

  // Ensure confetti interval cleared on unmount if navigation happens before animation ends
  useEffect(() => {
    return () => {
      if (confettiRef.current) clearInterval(confettiRef.current);
    };
  }, []);

  // Helper function to get currency symbol
  const getCurrencySymbol = (currency: string) => {
    const currencies = [
      { value: "EUR", symbol: "€" },
      { value: "USD", symbol: "$" },
    ];
    return currencies.find((c) => c.value === currency)?.symbol || "€";
  };

  // Create the validation schema with translations
  const salaryEntrySchema = createSalaryEntrySchema(t);

  const form = useForm<SalaryEntryFormData>({
    resolver: zodResolver(salaryEntrySchema),
    defaultValues: {
      multinational: false,
      currency: "EUR",
      workerType: "whiteCollar",
      benefits: [],
    },
  });

  const selectedCountry = form.watch("country");
  const selectedCurrency = form.watch("currency");
  const selectedWorkerType = (form.watch("workerType") as string) || "whiteCollar";
  const selectedContractType = form.watch("contractType") as string | undefined;
  const hasCompanyCar = form.watch("hasCompanyCar");
  const grossSalary = form.watch("grossSalary");
  const netSalary = form.watch("netSalary");
  const formConfig = selectedCountry ? getFormConfigForCountry(selectedCountry) : null;
  const isDirty = form.formState.isDirty;

  // Warn before leaving (refresh / close / back) with unsaved changes
  useEffect(() => {
    if (!isDirty || isSubmitting) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty, isSubmitting]);

  const handleCancel = () => {
    if (isDirty && !isSubmitting) {
      setShowDiscard(true);
    } else {
      router.push(`/${locale}/dashboard`);
    }
  };

  // Debounced alerts calculation
  useEffect(() => {
    const calculateAlerts = () => {
      const alerts: string[] = [];
      const net = parseFloat(String(netSalary || 0));
      const gross = parseFloat(String(grossSalary || 0));

      const hasNet = netSalary !== undefined && netSalary !== null && netSalary !== "";
      const hasGross = grossSalary !== undefined && grossSalary !== null && grossSalary !== "";

      const netTooLowThreshold = formConfig?.salaryValidation?.netTooLowThreshold ?? 0.4;
      const netTooCloseThreshold = formConfig?.salaryValidation?.netTooCloseThreshold ?? 0.95;

      if (hasNet && hasGross && !isNaN(net) && !isNaN(gross) && net > gross) {
        alerts.push("netHigherThanGross");
      } else if (
        hasNet &&
        hasGross &&
        !isNaN(net) &&
        !isNaN(gross) &&
        gross > 0 &&
        net / gross > netTooCloseThreshold
      ) {
        alerts.push("netTooCloseToGross");
      } else if (
        hasNet &&
        hasGross &&
        !isNaN(net) &&
        !isNaN(gross) &&
        gross > 0 &&
        net / gross < netTooLowThreshold
      ) {
        alerts.push("netTooLow");
      }

      setDebouncedAlerts(alerts);
    };

    const timeoutId = setTimeout(calculateAlerts, 300);
    return () => clearTimeout(timeoutId);
  }, [netSalary, grossSalary, formConfig]);

  // Scroll-spy: highlight the section currently in view in the side navigator
  useEffect(() => {
    if (!selectedCountry || !formConfig) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-section]"));
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const id = visible[0]?.target.getAttribute("data-section");
        if (id) setActiveSection(id);
      },
      { rootMargin: "-25% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [selectedCountry, formConfig]);

  // Load entry data when in edit mode
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId) {
      const entryId = Number.parseInt(editId);
      setEditEntryId(entryId);
      setIsEditMode(true);
      setIsLoadingEntry(true);

      // Check if we have the token for ownership verification
      const token = getEntryToken(entryId);
      if (!token) {
        setError(tEdit("errors.noToken"));
        setIsLoadingEntry(false);
        return;
      }

      // Load the entry data
      fetch(`/api/entries/${entryId}`)
        .then((res) => {
          if (!res.ok) {
            if (res.status === 404) {
              throw new Error(tEdit("errors.notFound"));
            }
            throw new Error(tEdit("errors.generic"));
          }
          return res.json();
        })
        .then((data) => {
          // Verify ownership using proper token verification
          if (!verifyOwnerToken(token, entryId, data.ownerToken, data.editableUntil)) {
            setError(tEdit("errors.notOwner"));
            setIsLoadingEntry(false);
            return;
          }

          // Check if entry is still editable
          if (!isEntryEditable(data.editableUntil)) {
            setError(tEdit("errors.expired"));
            setIsLoadingEntry(false);
            return;
          }

          setEditableUntil(data.editableUntil);

          // Populate the form with the entry data
          form.reset({
            country: data.country || undefined,
            // v2 worker-type + compensation model
            workerType: data.workerType || "whiteCollar",
            contractType: data.contractType || undefined,
            contractDurationMonths: data.contractDurationMonths ?? undefined,
            salaryBasis: data.salaryBasis || undefined,
            fixedGrossSalary: data.fixedGrossSalary ?? undefined,
            variableGrossSalary: data.variableGrossSalary ?? undefined,
            hourlyRate: data.hourlyRate ?? undefined,
            dayRate: data.dayRate ?? undefined,
            agencyCutPercent: data.agencyCutPercent ?? undefined,
            clientDayBudget: data.clientDayBudget ?? undefined,
            bursaryAmount: data.bursaryAmount ?? undefined,
            virtualGrossSalary: data.virtualGrossSalary ?? undefined,
            hasCompanyCar: data.hasCompanyCar ?? undefined,
            companyCarModel: data.companyCarModel || undefined,
            companyCarFuelType: data.companyCarFuelType || undefined,
            companyCarCardScope: data.companyCarCardScope || undefined,
            hasEquity: data.hasEquity ?? undefined,
            benefits: Array.isArray(data.benefits)
              ? data.benefits.map((b: any) => ({
                  benefitKey: b.benefitKey,
                  valueNumeric: b.valueNumeric ?? undefined,
                  valueText: b.valueText ?? undefined,
                  currency: b.currency ?? undefined,
                }))
              : [],
            age: data.age || undefined,
            education: data.education || undefined,
            degreeId: data.degreeId ?? undefined,
            workExperience: data.workExperience ?? undefined,
            civilStatus: data.civilStatus || undefined,
            dependents: data.dependents ?? undefined,
            sector: data.sector || undefined,
            employeeCount: data.employeeCount || undefined,
            multinational: data.multinational || false,
            publiclyListed: data.publiclyListed ?? undefined,
            jobTitle: data.jobTitle || undefined,
            jobDescription: data.jobDescription || undefined,
            seniority: data.seniority ?? undefined,
            officialHours: data.officialHours || undefined,
            averageHours: data.averageHours || undefined,
            shiftDescription: data.shiftDescription || undefined,
            onCall: data.onCall || undefined,
            vacationDays: data.vacationDays ?? undefined,
            currency: data.currency || "EUR",
            grossSalary: data.grossSalary || undefined,
            netSalary: data.netSalary || undefined,
            netCompensation: data.netCompensation ?? undefined,
            thirteenthMonth: data.thirteenthMonth || undefined,
            mealVouchers: data.mealVouchers ?? undefined,
            ecoCheques: data.ecoCheques ?? undefined,
            groupInsurance: data.groupInsurance || undefined,
            otherInsurances: data.otherInsurances || undefined,
            otherBenefits: data.otherBenefits || undefined,
            locationGranularity: data.locationGranularity || undefined,
            workProvince: data.workProvince || undefined,
            residenceCountry: data.residenceCountry || undefined,
            commuteUnit: data.commuteUnit || undefined,
            workCity: data.workCity || undefined,
            commuteDistance: data.commuteDistance
              ? cleanCommuteDistance(data.commuteDistance.toString())
              : undefined,
            commuteTimeMinutes: data.commuteTimeMinutes ?? undefined,
            commuteMethod: data.commuteMethod || undefined,
            commuteCompensation: data.commuteCompensation || undefined,
            teleworkDays: data.teleworkDays ?? undefined,
            dayOffEase: data.dayOffEase || undefined,
            stressLevel: data.stressLevel || undefined,
            jobSatisfaction: data.jobSatisfaction ?? undefined,
            reports: data.reports ?? undefined,
            extraNotes: data.extraNotes || undefined,
          });
          setIsLoadingEntry(false);
        })
        .catch((error) => {
          logError("Error loading entry:", error, { entryId });
          setError(error.message || tEdit("errors.generic"));
          setIsLoadingEntry(false);
        });
    }
  }, [searchParams, form, router, locale, t, tEdit]);

  const onSubmit = async (data: SalaryEntryFormData) => {
    setIsSubmitting(true);
    setError(null);
    setRetryAfter(null);
    try {
      // Determine if we're editing or creating
      const url = isEditMode && editEntryId ? `/api/entries/${editEntryId}` : "/api/entries";
      const method = isEditMode ? "PUT" : "POST";

      // Get owner token if editing
      const bodyData: any = {
        ...data,
        source: "Manual submission",
        commuteDistance: data.commuteDistance
          ? cleanCommuteDistance(data.commuteDistance.toString())
          : undefined,
      };
      if (isEditMode && editEntryId) {
        const tokens = localStorage.getItem("wagewatchers_entry_tokens");
        const tokenMap = tokens ? JSON.parse(tokens) : {};
        const ownerToken = tokenMap[editEntryId.toString()];
        if (ownerToken) {
          bodyData.ownerToken = ownerToken;
        }
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });
      if (res.ok) {
        const entry = await res.json();

        // Store the owner token in localStorage for future access
        if (entry.ownerToken && entry.id) {
          const tokens = localStorage.getItem("wagewatchers_entry_tokens");
          const tokenMap = tokens ? JSON.parse(tokens) : {};
          tokenMap[entry.id.toString()] = entry.ownerToken;
          localStorage.setItem("wagewatchers_entry_tokens", JSON.stringify(tokenMap));
        }

        // Trigger confetti celebration
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = {
          startVelocity: 30,
          spread: 360,
          ticks: 60,
          zIndex: 0,
        };

        function randomInRange(min: number, max: number) {
          return Math.random() * (max - min) + min;
        }

        const intervalId = window.setInterval(function () {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(intervalId);
          }

          const particleCount = 50 * (timeLeft / duration);
          confetti({
            ...defaults,
            particleCount,
            origin: {
              x: randomInRange(0.1, 0.3),
              y: Math.random() - 0.2,
            },
          });
          confetti({
            ...defaults,
            particleCount,
            origin: {
              x: randomInRange(0.7, 0.9),
              y: Math.random() - 0.2,
            },
          });
        }, 250);

        confettiRef.current = intervalId;

        // Ensure interval cleared on unmount (in case navigation happens before animation ends)
        // We use a ref-based cleanup effect declared once at component top-level (see addition above).

        form.reset();
        const successMessage = isEditMode ? "updated=true" : "success=true";
        router.push(`/${locale}/my-entries?${successMessage}`);
      } else {
        const errorData = await res.json().catch(() => ({}));
        logWarning("Submission failed:", { errorData, status: res.status });

        // Handle rate limit errors with retry timing
        if (res.status === 429 && errorData.retryAfter) {
          setRetryAfter(new Date(errorData.retryAfter));
          setError(errorData.message || t("rateLimitExceeded"));
        } else {
          setRetryAfter(null);
          setError(errorData.details || errorData.error || t("error"));
        }
      }
    } catch (err) {
      logError("Submission error:", err);
      setError(t("errorGeneric"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Field rendering configurations - now loaded from external config
  // and filtered by country to only show relevant fields
  const allFieldConfigs = createFieldConfigs(t);
  const fieldConfigs = selectedCountry
    ? getFieldConfigsForCountry(selectedCountry, allFieldConfigs)
    : allFieldConfigs;

  const getSectionKey = (title: string): string => {
    const sectionMappings: Record<string, string> = {
      "Employment Type": "employment",
      "Personal Information": "personal",
      "Employer Profile": "employer",
      "Job Profile": "job",
      "Working Hours": "workingHours",
      Salary: "salary",
      Benefits: "benefits",
      Commute: "commute",
      "Work-Life Balance": "workLife",
      "Additional Notes": "notes",
    };
    return sectionMappings[title] || title.toLowerCase().replace(/\s+/g, "");
  };

  const getFieldElement = (config: any, field: any, fieldName?: string) => {
    // Degree picker: combobox over the curated catalog, storing the numeric id.
    if (fieldName === "degreeId") {
      const degreeOptions = getDegreesFor(selectedCountry).map((d) => ({
        value: String(d.id),
        label: d.name,
      }));
      return (
        <Combobox
          options={degreeOptions}
          value={field.value != null ? String(field.value) : undefined}
          onValueChange={(v: string) => field.onChange(v ? Number(v) : undefined)}
          placeholder={config.placeholder}
          allowCustom={false}
        />
      );
    }

    // Contract-type options depend on the selected worker type.
    if (fieldName === "contractType") {
      const allowed =
        CONTRACT_TYPES_BY_WORKER[selectedWorkerType] ??
        (config.options || []).map((o: any) => o.value);
      const opts = (config.options || []).filter((o: any) => allowed.includes(o.value));
      return (
        <Select onValueChange={field.onChange} value={field.value?.toString() || undefined}>
          <SelectTrigger>
            <SelectValue placeholder={config.placeholder || "Select option"} />
          </SelectTrigger>
          <SelectContent>
            {opts.map((option: any) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Special handling for workCity field with city combobox
    if (fieldName === "workCity") {
      return (
        <CityCombobox
          value={field.value?.toString() || ""}
          onChange={field.onChange}
          location={selectedCountry}
          placeholder={config.placeholder}
        />
      );
    }

    // Special handling for money fields with currency selector
    if (fieldName && MONEY_FIELDS.includes(fieldName)) {
      return (
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">
            {getCurrencySymbol(selectedCurrency)}
          </span>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder={config.placeholder}
            {...field}
            value={field.value?.toString() || ""}
            onChange={(e) =>
              field.onChange(e.target.value ? Number.parseFloat(e.target.value) : undefined)
            }
            className="pl-7 font-mono"
          />
        </div>
      );
    }

    // Special handling for hours, vacation days and telework days with 0.5 step
    const decimalFields = ["officialHours", "averageHours", "vacationDays", "teleworkDays"];
    if (fieldName && decimalFields.includes(fieldName)) {
      return (
        <Input
          type="number"
          min="0"
          step="0.5"
          placeholder={config.placeholder}
          {...field}
          value={field.value?.toString() || ""}
          onChange={(e) =>
            field.onChange(e.target.value ? Number.parseFloat(e.target.value) : undefined)
          }
        />
      );
    }

    switch (config.type) {
      case "text":
        return (
          <Input
            placeholder={config.placeholder}
            {...field}
            value={field.value?.toString() || ""}
          />
        );
      case "number": {
        return (
          <Input
            type="number"
            min="0"
            placeholder={config.placeholder}
            {...field}
            onChange={(e) =>
              field.onChange(e.target.value ? Number.parseInt(e.target.value) : undefined)
            }
            value={field.value?.toString() || ""}
          />
        );
      }
      case "textarea":
        return (
          <Textarea
            placeholder={config.placeholder}
            {...field}
            value={field.value?.toString() || ""}
          />
        );
      case "richtext":
        return (
          <RichTextEditor
            content={field.value?.toString() || ""}
            onChange={field.onChange}
            placeholder={config.placeholder}
          />
        );
      case "combobox":
        return (
          <Combobox
            options={config.options || []}
            value={field.value?.toString()}
            onValueChange={field.onChange}
            placeholder={config.placeholder}
            allowCustom={config.allowCustom}
          />
        );
      case "select":
        return (
          <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
            <SelectTrigger>
              <SelectValue placeholder={config.placeholder || "Select option"} />
            </SelectTrigger>
            <SelectContent>
              {config.options?.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "boolean":
        return (
          <div className="inline-flex rounded-lg border border-input p-0.5">
            {config.options?.map((option: any) => {
              const optYes = option.value === "yes";
              const selected = optYes ? field.value === true : field.value !== true;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => field.onChange(optYes)}
                  aria-pressed={selected}
                  className={cn(
                    "rounded-md px-5 py-1.5 text-sm font-medium transition-colors",
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
      default:
        return <div>Unknown field type</div>;
    }
  };

  const renderField = (fieldName: string) => {
    const config = fieldConfigs[fieldName];
    if (!config) return null;

    const getWidthClass = (width?: string) => {
      switch (width) {
        case "half":
          return "col-span-6 md:col-span-3";
        case "third":
          return "col-span-6 md:col-span-2";
        default:
          return "col-span-6";
      }
    };

    const widthClass = getWidthClass(config.width);

    return (
      <FormField
        key={fieldName}
        control={form.control}
        name={fieldName as keyof SalaryEntryFormData}
        render={({ field, fieldState }) => (
          <FormItem className={cn(widthClass, "space-y-2")}>
            <FormLabel className="flex items-center gap-1.5 text-foreground">
              <span>
                {MONEY_FIELDS.includes(fieldName)
                  ? t(config.labelKey, { symbol: getCurrencySymbol(selectedCurrency) })
                  : t(config.labelKey)}
              </span>
              {config.optional && (
                <span className="text-xs font-normal text-muted-foreground">
                  ({tCommon("optional")})
                </span>
              )}
              {config.helpKey && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label={t("fieldExplanations")}
                      className="text-muted-foreground transition-colors hover:text-brand"
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="top" align="start" className="w-72">
                    <p className="text-sm text-muted-foreground">{t(config.helpKey)}</p>
                    {config.placeholder && (
                      <p className="mt-2 rounded bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                        {t("example")}: {config.placeholder}
                      </p>
                    )}
                  </PopoverContent>
                </Popover>
              )}
            </FormLabel>
            <FormControl>
              <div className="relative">{getFieldElement(config, field, fieldName)}</div>
            </FormControl>
            {fieldState.error && (
              <p className="text-sm font-medium text-destructive">{fieldState.error.message}</p>
            )}
          </FormItem>
        )}
      />
    );
  };

  // Worker-type-aware visibility: hide fields not applicable to the selected
  // worker type, and hide company-car detail fields until "has company car".
  const isFieldVisible = (fieldName: string): boolean => {
    const config = fieldConfigs[fieldName];
    if (!config) return false;
    if (config.workerTypes && !config.workerTypes.includes(selectedWorkerType)) return false;
    if (COMPANY_CAR_DETAIL_FIELDS.includes(fieldName) && hasCompanyCar !== true) return false;
    // Contract duration only matters for non-permanent contracts (fixed-term,
    // interim, internship, freelance). Hidden for permanent / unspecified.
    if (
      fieldName === "contractDurationMonths" &&
      (!selectedContractType || selectedContractType === "permanent")
    ) {
      return false;
    }
    return true;
  };

  const navSections = selectedCountry && formConfig ? formConfig.sections : [];
  const navItems = [
    { key: "location", label: t("sections.location.title"), num: null as number | null },
    ...navSections.map((s, i) => ({
      key: getSectionKey(s.title),
      label: t(`sections.${getSectionKey(s.title)}.title`),
      num: i + 1,
    })),
  ];
  const activeIndex = navItems.findIndex((x) => x.key === activeSection);

  return (
    <PageShell width="lg">
      {/* Show error UI for edit mode */}
      {error && isEditMode && (
        <div className="flex min-h-[60vh] items-center justify-center">
          <Card className="w-full max-w-md border-border bg-card/80 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <Lock className="mx-auto mb-4 h-12 w-12 text-destructive" />
              <h2 className="mb-2 text-2xl font-bold text-foreground">{tEdit("errorTitle")}</h2>
              <p className="mb-4 text-muted-foreground">{error}</p>
              {retryAfter && (
                <p className="mb-6 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
                  {t("rateLimitRetry", {
                    time: (() => {
                      const now = new Date();
                      const diffMs = retryAfter.getTime() - now.getTime();
                      if (diffMs <= 0) return "now";
                      const diffMins = Math.floor(diffMs / 60000);
                      const diffHours = Math.floor(diffMins / 60);
                      const remainingMins = diffMins % 60;
                      if (diffHours > 0) {
                        const hourText = diffHours === 1 ? "hour" : "hours";
                        const minText = remainingMins === 1 ? "minute" : "minutes";
                        return `${diffHours} ${hourText} ${remainingMins} ${minText}`;
                      } else if (diffMins > 0) {
                        const minText = diffMins === 1 ? "minute" : "minutes";
                        return `${diffMins} ${minText}`;
                      } else {
                        return "less than a minute";
                      }
                    })(),
                  })}
                </p>
              )}
              <div className="space-x-4">
                <Button variant="outline" onClick={() => router.push(`/${locale}/dashboard`)}>
                  {tEdit("goBack")}
                </Button>
                <Button onClick={() => router.push(`/${locale}/my-entries`)}>
                  {tEdit("goToMyEntries")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Show error UI for add mode */}
      {error && !isEditMode && (
        <ErrorPage
          title={t("error")}
          message={error}
          retryAfter={retryAfter}
          onRetry={() => {
            // Retry submission with the same form data
            const formData = form.getValues();
            onSubmit(formData);
          }}
          onGoHome={() => router.push(`/${locale}/dashboard`)}
        />
      )}

      {/* Show title/description only when not in edit mode error */}
      {!error && (
        <>
          {isEditMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/${locale}/dashboard`)}
              className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("goBack")}
            </Button>
          )}
          <PageHeader
            eyebrow={t("eyebrow")}
            title={isEditMode ? t("editTitle") : t("title")}
            subtitle={isEditMode ? t("editSubtitle") : t("subtitle")}
          />
          {isEditMode &&
            editableUntil &&
            (() => {
              const remaining = getEditTimeRemaining(new Date(editableUntil));
              if (!remaining.editable) return null;
              const untilDate = new Date(editableUntil).toLocaleDateString(locale, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              const remainingLabel =
                remaining.hoursLeft > 24
                  ? tEdit("window.remainingDays", { days: remaining.daysLeft })
                  : tEdit("window.remainingHours", { hours: remaining.hoursLeft });
              return (
                <Alert className="mb-6 border-brand/30 bg-brand/5">
                  <CalendarClock className="h-4 w-4 text-brand" />
                  <AlertDescription className="text-foreground">
                    <span className="font-medium">{remainingLabel}</span>{" "}
                    {tEdit("window.until", { date: untilDate })}{" "}
                    <span className="text-muted-foreground">{tEdit("window.lockNote")}</span>
                  </AlertDescription>
                </Alert>
              );
            })()}
        </>
      )}

      {!error &&
        (isLoadingEntry ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <LoadingSpinner message={t("loadingEntry")} fullScreen={false} size="lg" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)]">
                {/* Section navigator (desktop) */}
                <aside className="hidden lg:block">
                  <nav className="sticky top-24">
                    <div className="relative">
                      {/* progress rail */}
                      <div
                        aria-hidden="true"
                        className="absolute bottom-5 left-6 top-5 w-px -translate-x-1/2 bg-border"
                      />
                      <div className="relative space-y-1">
                        {navItems.map((item, i) => {
                          const isActive = activeSection === item.key;
                          const isDone = activeIndex > -1 && i < activeIndex;
                          return (
                            <a
                              key={item.key}
                              href={`#sec-${item.key}`}
                              className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                                isActive
                                  ? "font-medium text-foreground"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <span
                                className={cn(
                                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] transition-colors",
                                  isActive
                                    ? "border-brand bg-brand text-brand-foreground"
                                    : isDone
                                      ? "border-brand bg-brand/15 text-brand"
                                      : "border-border bg-background text-muted-foreground"
                                )}
                              >
                                {item.num ?? <MapPin className="h-3 w-3" />}
                              </span>
                              <span className="truncate">{item.label}</span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  </nav>
                </aside>

                {/* Form column */}
                <div className="min-w-0 space-y-6">
                  {/* Location */}
                  <Card
                    id="sec-location"
                    data-section="location"
                    className="scroll-mt-24 border-border bg-card/80 backdrop-blur-sm"
                  >
                    <CardHeader className="border-b border-border">
                      <CardTitle className="text-foreground">
                        {t("sections.location.title")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-6 gap-4">
                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field, fieldState }) => (
                            <FormItem className="col-span-6 space-y-2 md:col-span-4">
                              <FormLabel className="text-foreground">
                                {t("fields.country.label")}
                              </FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t("fields.country.placeholder")} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {getAllCountries().map((country) => (
                                    <SelectItem key={country} value={country}>
                                      {t(`countries.${country.toLowerCase()}`)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {fieldState.error && (
                                <p className="text-sm font-medium text-destructive">
                                  {fieldState.error.message}
                                </p>
                              )}
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="currency"
                          render={({ field, fieldState }) => (
                            <FormItem className="col-span-6 space-y-2 md:col-span-2">
                              <FormLabel className="text-foreground">
                                {t("fields.currency.label")}
                              </FormLabel>
                              <FormControl>
                                <CurrencySelector
                                  value={field.value}
                                  onValueChange={field.onChange}
                                  placeholder={t("fields.currency.placeholder")}
                                  showFullLabel={true}
                                  className="w-full"
                                />
                              </FormControl>
                              {fieldState.error && (
                                <p className="text-sm font-medium text-destructive">
                                  {fieldState.error.message}
                                </p>
                              )}
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Prompt to choose a country before the rest loads */}
                  {!selectedCountry && (
                    <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
                      <MapPin className="mx-auto mb-3 h-7 w-7 text-muted-foreground" />
                      <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                        {t("countryFirst")}
                      </p>
                    </div>
                  )}

                  {/* Country-specific sections */}
                  {selectedCountry && formConfig && (
                    <>
                      {formConfig.sections.map((section, index) => {
                        const sectionKey = getSectionKey(section.title);
                        return (
                          <Card
                            key={section.title}
                            id={`sec-${sectionKey}`}
                            data-section={sectionKey}
                            className="relative scroll-mt-24 border-border bg-card/80 backdrop-blur-sm"
                          >
                            <CardHeader className="border-b border-border">
                              <CardTitle className="flex items-center gap-3 text-foreground">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand font-mono text-xs text-brand-foreground">
                                  {index + 1}
                                </span>
                                {t(`sections.${sectionKey}.title`)}
                              </CardTitle>
                            </CardHeader>
                            {sectionKey === "salary" && debouncedAlerts.length > 0 && (
                              <div className="space-y-3 px-6 pt-6">
                                {debouncedAlerts.map((alertKey) => (
                                  <Alert key={alertKey} variant="destructive">
                                    <AlertDescription>
                                      {t(`salaryAlert.${alertKey}`)}
                                    </AlertDescription>
                                  </Alert>
                                ))}
                              </div>
                            )}
                            <CardContent className="pt-6">
                              <div className="grid grid-cols-6 gap-x-4 gap-y-5">
                                {section.fields
                                  .filter((fieldName) => isFieldVisible(fieldName))
                                  .map((fieldName) => renderField(fieldName))}
                              </div>
                              {sectionKey === "benefits" && (
                                <div className="mt-6 border-t border-border pt-6">
                                  <FormField
                                    control={form.control}
                                    name="benefits"
                                    render={({ field }) => (
                                      <BenefitsSelector
                                        country={selectedCountry}
                                        workerType={selectedWorkerType}
                                        currency={selectedCurrency}
                                        currencySymbol={getCurrencySymbol(selectedCurrency)}
                                        value={(field.value as EntryBenefitValue[]) || []}
                                        onChange={(next) =>
                                          field.onChange(next as EntryBenefitValue[])
                                        }
                                      />
                                    )}
                                  />
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}

                      {/* Honesty confirmation */}
                      <Card className="border-border bg-card/80 backdrop-blur-sm">
                        <CardContent>
                          <FormField
                            control={form.control}
                            name="honestyConfirmation"
                            render={({ field, fieldState }) => (
                              <FormItem className="space-y-2">
                                <div className="flex items-start gap-3">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      className="mt-0.5"
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal leading-relaxed text-muted-foreground">
                                    {t("honestyConfirmation")}
                                  </FormLabel>
                                </div>
                                {fieldState.error && (
                                  <p className="text-sm font-medium text-destructive">
                                    {fieldState.error.message}
                                  </p>
                                )}
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              {selectedCountry && formConfig && (
                <div className="mt-10 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" size="lg" onClick={handleCancel}>
                    {tCommon("cancel")}
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="bg-brand px-8 font-semibold text-brand-foreground hover:bg-brand/90"
                  >
                    {getSubmitButtonText(isSubmitting, isEditMode, t)}
                  </Button>
                </div>
              )}
            </form>
          </Form>
        ))}

      {/* Discard-changes guard */}
      <Dialog open={showDiscard} onOpenChange={setShowDiscard}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("discardTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("discardMessage")}</p>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setShowDiscard(false)}>
              {t("discardKeep")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowDiscard(false);
                router.push(`/${locale}/dashboard`);
              }}
            >
              {t("discardConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

export default function AddClient() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddEntryContent />
    </Suspense>
  );
}
