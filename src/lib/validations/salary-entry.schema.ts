import { z } from "zod";
import { countryCollectsField, VACATION_DAYS_WORKER_TYPES } from "@/lib/field-configs";

/**
 * Salary Entry Form Validation Schema
 * Comprehensive validation for manual salary entry submissions
 *
 * INVARIANT: only mark a field required (here or in superRefine) when the form
 * actually renders an input for it in the current (country, workerType,
 * salaryBasis) context. If the schema requires a field the form does not show,
 * react-hook-form fails validation but the error attaches to a non-rendered
 * input — producing a submit that silently does nothing (no message, no
 * network). The country / worker-type gates below exist to keep this invariant.
 */

// v2 enum values — duplicated locally (not imported from db/schema) so this
// client-bundled schema never pulls Drizzle/pg-core into the browser bundle.
// Keep in sync with the enums in src/lib/db/schema.ts.
const WORKER_TYPES = [
  "whiteCollar",
  "blueCollar",
  "freelancer",
  "intern",
  "phdResearcher",
] as const;
const SALARY_BASIS = ["gross", "net", "both"] as const;
const CONTRACT_TYPES = ["permanent", "fixedTerm", "interim", "internship", "freelance"] as const;
const CAR_FUEL_TYPES = ["electric", "hybrid", "fuel"] as const;
const CAR_CARD_SCOPES = ["belgium", "benelux", "europe"] as const;
const LOCATION_GRANULARITY = ["country", "province", "city"] as const;
const COMMUTE_UNITS = ["km", "minutes"] as const;

// Worker types that follow the classic salaried model (salary required, BE
// employee benefits like 13th month / group insurance apply).
const SALARIED_WORKER_TYPES = new Set<string>(["whiteCollar", "intern"]);

// Optional money field: a positive number or an (empty) string passthrough,
// mirroring how grossSalary/netSalary are modelled.
const optionalMoney = z.union([z.number().positive(), z.string()]).optional();
const hasValue = (v: unknown) => v !== undefined && v !== null && v !== "";

// Matches a URL anywhere inside a string: an explicit scheme (http://, https://,
// ftp://, …) or a bare "www." host. This scans substrings, unlike z.url() which
// only matches when the ENTIRE value is a URL — so embedded links like
// "see https://spam.com" are caught, while ordinary text with dots or
// abbreviations ("e.g.", "i.e.", "9.00") is left alone.
const URL_IN_STRING = /(?:[a-z][a-z0-9+.-]*:\/\/|www\.)/i;

// Custom URL validation - checks for common URL patterns
const noUrls = (fieldName: string) =>
  z.string().refine(
    (value) => {
      if (!value) return true; // Allow empty strings
      // Reject when the whole value is a URL (original behavior)…
      if (z.url().safeParse(value).success) return false;
      // …or when a URL appears embedded within the text.
      return !URL_IN_STRING.test(value);
    },
    {
      message: `URLs are not allowed in ${fieldName}`,
    }
  );

export const createSalaryEntrySchema = (t: (key: string) => string) => {
  return z.preprocess(
    (data: any) => {
      // Trim all string fields
      const trimmedData = { ...data };
      for (const key of Object.keys(trimmedData)) {
        if (typeof trimmedData[key] === "string") {
          trimmedData[key] = trimmedData[key].trim();
        }
      }
      return trimmedData;
    },
    z
      .object({
        // Country (Required)
        country: z.string().min(1, { message: t("validation.countryRequired") }),

        // Worker type (v2 discriminator). Defaults to whiteCollar so existing
        // payloads that omit it behave exactly as before.
        workerType: z.enum(WORKER_TYPES).optional().default("whiteCollar"),

        // Personal Information
        age: z
          .number({ message: t("validation.numberExpected") })
          .int({ message: t("validation.integerExpected") })
          .min(18, { message: t("validation.ageMin") })
          .max(100, { message: t("validation.ageMax") }),
        education: z
          .string()
          .min(1, { message: t("validation.educationRequired") })
          .max(200),
        // Canonical degree from the curated list (v2, optional). Loosely references
        // Degree.id; complements the free-text `education` level.
        degreeId: z.number().int().positive().optional(),
        workExperience: z
          .number({ message: t("validation.numberExpected") })
          .int({ message: t("validation.integerExpected") })
          .min(0)
          .max(82, { message: t("validation.workExperienceMax") }),
        civilStatus: z.string().min(1, { message: t("validation.civilStatusRequired") }),
        dependents: z
          .number({ message: t("validation.numberExpected") })
          .int({ message: t("validation.integerExpected") })
          .min(0)
          .max(20, { message: t("validation.dependentsMax") }),

        // Employer Profile
        sector: z.string().min(1, { message: t("validation.sectorRequired") }),
        employeeCount: z.string().min(1, { message: t("validation.employeeCountRequired") }),
        multinational: z.boolean(),
        publiclyListed: z.boolean().optional(), // Beursgenoteerd bedrijf?

        // Job Profile
        jobTitle: noUrls("job title")
          .min(1, { message: t("validation.jobTitleRequired") })
          .max(200, { message: t("validation.jobTitleMax") }),
        jobDescription: noUrls("job description")
          .max(5000, { message: t("validation.jobDescriptionMax") })
          .optional(),
        seniority: z
          .number({ message: t("validation.numberExpected") })
          .int({ message: t("validation.integerExpected") })
          .min(0)
          .max(50, { message: t("validation.seniorityMax") }),

        // Working Hours
        officialHours: z
          .number({ message: t("validation.numberExpected") })
          .min(1, { message: t("validation.hoursMin") })
          .max(80, { message: t("validation.hoursMax") })
          .refine((val) => val % 0.5 === 0, { message: t("validation.hoursStep") }),
        averageHours: z
          .number({ message: t("validation.numberExpected") })
          .min(1, { message: t("validation.hoursMin") })
          .max(80, { message: t("validation.hoursMax") })
          .refine((val) => val % 0.5 === 0, { message: t("validation.hoursStep") }),
        shiftDescription: noUrls("shift description")
          .max(1000, { message: t("validation.shiftDescriptionMax") })
          .optional(),
        onCall: z.string().optional(),
        // Vacation. Optional at the base level — the form hides this field for
        // freelancers (no statutory paid leave), so requiring it unconditionally
        // makes a freelancer submission silently un-submittable. Presence is
        // required only for the worker types that render it (see superRefine).
        vacationDays: z
          .number({ message: t("validation.numberExpected") })
          .min(0)
          .max(365, { message: t("validation.vacationDaysMax") })
          .refine((val) => val % 0.5 === 0, { message: t("validation.vacationDaysStep") })
          .optional(),

        // Salary & Currency
        currency: z.string().min(1, { message: t("validation.currencyRequired") }),
        // Optional at base so non-salaried worker-type forms (which don't render
        // these inputs) validate; the "at least one salary" rule for salaried
        // types is enforced in superRefine below.
        grossSalary: z
          .union([
            z.number().positive({ message: t("validation.grossSalaryPositive") }),
            z.string(),
          ])
          .optional(),
        netSalary: z
          .union([
            z.number().positive({ message: t("validation.grossSalaryPositive") }),
            z.string(),
          ])
          .optional(),
        netCompensation: z.union([z.number().min(0), z.string()]).optional(),

        // Salary semantics + fixed/variable split (v2, optional)
        salaryBasis: z.enum(SALARY_BASIS).optional(),
        fixedGrossSalary: z.union([z.number().min(0), z.string()]).optional(),
        variableGrossSalary: z.union([z.number().min(0), z.string()]).optional(),

        // Worker-type-specific compensation (v2, optional; required-ness enforced
        // per workerType in superRefine below)
        hourlyRate: optionalMoney, // blue-collar
        dayRate: optionalMoney, // freelancer
        agencyCutPercent: z.union([z.number().min(0).max(100), z.string()]).optional(), // freelancer
        clientDayBudget: optionalMoney, // freelancer
        bursaryAmount: optionalMoney, // PhD
        virtualGrossSalary: optionalMoney, // PhD

        // Contract context (v2, optional)
        contractType: z.enum(CONTRACT_TYPES).optional(),
        contractDurationMonths: z.union([z.number().int().min(0).max(600), z.string()]).optional(),

        // Structured company car + equity (v2, optional)
        hasCompanyCar: z.boolean().optional(),
        companyCarModel: z.string().max(120).optional(),
        companyCarFuelType: z.enum(CAR_FUEL_TYPES).optional(),
        companyCarCardScope: z.enum(CAR_CARD_SCOPES).optional(),
        hasEquity: z.boolean().optional(),

        // Location granularity + cross-border (v2, optional)
        locationGranularity: z.enum(LOCATION_GRANULARITY).optional(),
        workProvince: z.string().max(200).optional(),
        residenceCountry: z.string().max(200).optional(),
        commuteUnit: z.enum(COMMUTE_UNITS).optional(),

        // Benefits — thirteenthMonth/groupInsurance are optional at the base level
        // and required only for salaried worker types (see superRefine).
        thirteenthMonth: z.string().optional(),
        mealVouchers: z
          .union([
            z
              .number()
              .min(0)
              .max(12, { message: t("validation.mealVouchersMax") }),
            z.string(),
          ])
          .optional(),
        ecoCheques: z
          .union([
            z
              .number()
              .min(0)
              .max(10000, { message: t("validation.ecoChequesMax") }),
            z.string(),
          ])
          .optional(),
        groupInsurance: z.string().optional(),
        otherInsurances: noUrls("other insurances")
          .max(2000, { message: t("validation.otherInsurancesMax") })
          .optional(),
        otherBenefits: noUrls("other benefits")
          .max(2000, { message: t("validation.otherBenefitsMax") })
          .optional(),
        // Commute
        workCity: z
          .string()
          .max(200, { message: t("validation.workCityMax") })
          .optional(),
        commuteDistance: z
          .string()
          .min(1, { message: t("validation.commuteDistanceRequired") })
          .max(50, { message: t("validation.commuteDistanceMax") })
          .refine(
            (val) => {
              // Allow single numbers or ranges like "10-30"
              const rangeRegex = /^\d+(\.\d+)?-\d+(\.\d+)?$/;
              const singleRegex = /^\d+(\.\d+)?$/;
              return rangeRegex.test(val) || singleRegex.test(val);
            },
            { message: t("validation.commuteDistanceFormat") }
          ),
        commuteMethod: z.string().min(1, { message: t("validation.commuteMethodRequired") }),
        commuteCompensation: noUrls("commute compensation")
          .min(1, { message: t("validation.commuteCompensationRequired") })
          .max(1000, { message: t("validation.commuteCompensationMax") }),
        // Work-Life Balance
        teleworkDays: z
          .number({ message: t("validation.numberExpected") })
          .min(0)
          .max(7, { message: t("validation.teleworkMax") })
          .refine((val) => val % 0.5 === 0, { message: t("validation.hoursStep") }),
        dayOffEase: z.string().min(1, { message: t("validation.dayOffEaseRequired") }),
        stressLevel: z.string().min(1, { message: t("validation.stressLevelRequired") }),
        // 0–10 "how much do you enjoy your job" (NLSalaris); optional, applies everywhere.
        jobSatisfaction: z.number().int().min(0).max(10).optional(),
        commuteTimeMinutes: z.union([z.number().int().min(0).max(600), z.string()]).optional(),
        reports: z
          .number({ message: t("validation.numberExpected") })
          .int({ message: t("validation.integerExpected") })
          .min(0)
          .max(1000, { message: t("validation.reportsMax") })
          .optional(),

        // Additional
        sourceUrl: z.string().optional(),
        extraNotes: noUrls("extra notes")
          .max(5000, { message: t("validation.extraNotesMax") })
          .optional(),

        // Catalog benefits (v2) — one entry per selected benefit. Persisted as
        // EntryBenefit rows server-side; not a column on SalaryEntry.
        benefits: z
          .array(
            z.object({
              benefitKey: z.string().min(1),
              valueNumeric: z.number().optional(),
              valueText: z.string().max(500).optional(),
              currency: z.string().optional(),
            })
          )
          .optional(),

        // Validation
        honestyConfirmation: z.boolean().refine((val) => val === true, {
          message: t("validation.honestyRequired"),
        }),
      })
      .superRefine((data, ctx) => {
        const workerType = data.workerType ?? "whiteCollar";
        const hasAnySalary =
          hasValue(data.grossSalary) || hasValue(data.netSalary) || hasValue(data.netCompensation);

        // Worker-type-specific compensation requirement.
        if (workerType === "freelancer") {
          if (!hasValue(data.dayRate)) {
            ctx.addIssue({
              code: "custom",
              message: t("validation.dayRateRequired"),
              path: ["dayRate"],
            });
          }
        } else if (workerType === "blueCollar") {
          if (!hasValue(data.hourlyRate) && !hasAnySalary) {
            ctx.addIssue({
              code: "custom",
              message: t("validation.hourlyRateRequired"),
              path: ["hourlyRate"],
            });
          }
        } else if (workerType === "phdResearcher") {
          if (
            !hasValue(data.bursaryAmount) &&
            !hasValue(data.virtualGrossSalary) &&
            !hasAnySalary
          ) {
            ctx.addIssue({
              code: "custom",
              message: t("validation.bursaryRequired"),
              path: ["bursaryAmount"],
            });
          }
        } else {
          // whiteCollar | intern — classic salaried model. The salary-basis
          // selector was removed (basis is always "both"), so BOTH gross and net
          // are always shown and both are required. This is why some rows had an
          // N/A net: the old rule only needed ONE of gross/net, so gross-only
          // submissions stored a null net. Both fields render for these worker
          // types, so requiring them never strands an error on a hidden input.
          if (!hasValue(data.grossSalary)) {
            ctx.addIssue({
              code: "custom",
              message: t("validation.grossSalaryRequired"),
              path: ["grossSalary"],
            });
          }
          if (!hasValue(data.netSalary)) {
            ctx.addIssue({
              code: "custom",
              message: t("validation.netSalaryRequired"),
              path: ["netSalary"],
            });
          }
        }

        // Vacation days: required for the worker types that render the field
        // (freelancers don't see it), and only where the country collects it.
        if (
          VACATION_DAYS_WORKER_TYPES.includes(workerType) &&
          countryCollectsField(data.country, "vacationDays") &&
          !hasValue(data.vacationDays)
        ) {
          ctx.addIssue({
            code: "custom",
            message: t("validation.vacationDaysRequired"),
            path: ["vacationDays"],
          });
        }

        // 13th month + group insurance are required for salaried worker types,
        // but ONLY in countries whose form collects them (Belgium). The
        // Netherlands form omits these fields entirely (its benefits come from
        // the catalog), so requiring them there attached the error to inputs the
        // NL user could never fill — making every NL salaried submission silently
        // fail. Gate on countryCollectsField so the requirement tracks the form.
        if (SALARIED_WORKER_TYPES.has(workerType)) {
          if (
            countryCollectsField(data.country, "thirteenthMonth") &&
            !hasValue(data.thirteenthMonth)
          ) {
            ctx.addIssue({
              code: "custom",
              message: t("validation.thirteenthMonthRequired"),
              path: ["thirteenthMonth"],
            });
          }
          if (
            countryCollectsField(data.country, "groupInsurance") &&
            !hasValue(data.groupInsurance)
          ) {
            ctx.addIssue({
              code: "custom",
              message: t("validation.groupInsuranceRequired"),
              path: ["groupInsurance"],
            });
          }
        }
      })
      .refine(
        (data) => {
          // Work experience cannot exceed years since age 16
          if (data.age && data.workExperience) {
            const maxPossibleExperience = data.age - 16;
            return data.workExperience <= maxPossibleExperience;
          }
          return true;
        },
        {
          message: t("validation.workExperienceVsAge"),
          path: ["workExperience"],
        }
      )
      .refine(
        (data) => {
          // Seniority cannot exceed total work experience
          if (data.seniority && data.workExperience) {
            return data.seniority <= data.workExperience;
          }
          return true;
        },
        {
          message: t("validation.seniorityVsExperience"),
          path: ["seniority"],
        }
      )
  );
};

export type SalaryEntryFormData = z.infer<ReturnType<typeof createSalaryEntrySchema>>;

// Identity translator for server-side validation: the API returns raw message
// keys (the browser already renders localized copy), so no i18n is needed here.
const identityTranslator = (key: string) => key;

export type SalaryEntryValidationResult =
  | { success: true }
  | { success: false; fieldErrors: Record<string, string[]>; formErrors: string[] };

/**
 * Server-side guard for the create (POST) and edit (PUT) entry endpoints.
 *
 * The comprehensive validation in {@link createSalaryEntrySchema} runs only in
 * the browser via react-hook-form. The API must never trust the client: a
 * scripted request, disabled JavaScript, or a stale build could otherwise
 * insert/update an entry that skips required fields — most notably a salaried
 * entry with no gross salary, which is stored as NULL and shows up as "N/A".
 * This re-runs the exact same rules on the server.
 *
 * Gating only: on success the caller keeps its ORIGINAL body for the DB write
 * (the schema strips server-only extras like `source` / `ownerToken`, so the
 * parsed output must not be used for persistence).
 */
export function validateSalaryEntryPayload(payload: unknown): SalaryEntryValidationResult {
  const result = createSalaryEntrySchema(identityTranslator).safeParse(payload);
  if (result.success) {
    return { success: true };
  }
  const { fieldErrors, formErrors } = z.flattenError(result.error);
  return { success: false, fieldErrors, formErrors };
}
