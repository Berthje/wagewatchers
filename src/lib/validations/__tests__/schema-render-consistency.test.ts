import { describe, it, expect } from "vitest";
import { createSalaryEntrySchema } from "../salary-entry.schema";
import {
  createFieldConfigs,
  getFieldConfigsForCountry,
  COUNTRY_FIELD_CONFIGS,
} from "@/lib/field-configs";
import { COUNTRY_FORM_CONFIGS } from "@/lib/salary-config";

/**
 * These tests enforce the load-bearing invariant behind the "submit does
 * nothing / no validation message" bug:
 *
 *   The schema must NEVER require (or reject-into) a field that the form does
 *   not render for the current (country, workerType). If it does, react-hook-
 *   form fails validation but the error attaches to a non-rendered input, so the
 *   user sees nothing and the submit silently no-ops.
 *
 * They derive the set of rendered fields from the SAME config the form uses
 * (COUNTRY_FIELD_CONFIGS + section lists + per-field workerTypes gating), so if
 * anyone adds a required field, changes a country allow-list, or tightens a
 * worker-type gate without keeping the schema in step, these fail on the next
 * `pnpm test` — before it can ship.
 */

const t = (key: string) => key;
const schema = createSalaryEntrySchema(t);
const allConfigs = createFieldConfigs(t);

const COUNTRIES = Object.keys(COUNTRY_FIELD_CONFIGS); // Belgium, Netherlands
const WORKER_TYPES = ["whiteCollar", "blueCollar", "freelancer", "intern", "phdResearcher"];

// Fields the form renders outside the config-driven sections, plus the array
// field. These are always available to the user, so schema errors on them are
// never "hidden".
const ALWAYS_RENDERED = new Set(["country", "currency", "honestyConfirmation", "benefits"]);

/**
 * Replicate the form's field-visibility for the DEFAULT state (no salary-basis /
 * location / company-car narrowing — those only hide extra optional fields).
 * A field renders iff it survives the country allow-list, is listed in a section
 * for that country, and its worker-type gate (if any) includes workerType.
 */
function renderedFields(country: string, workerType: string): Set<string> {
  const set = new Set(ALWAYS_RENDERED);
  const configs = getFieldConfigsForCountry(country, allConfigs);
  for (const section of COUNTRY_FORM_CONFIGS[country].sections) {
    for (const name of section.fields) {
      const cfg = configs[name];
      if (!cfg) continue; // dropped by the country allow-list
      if (cfg.workerTypes && !cfg.workerTypes.includes(workerType)) continue; // worker-type gate
      set.add(name);
    }
  }
  return set;
}

// Valid sample values for every field that can render. Cross-field constraints
// are satisfied (workExperience <= age-16, seniority <= workExperience).
const VALID_VALUES: Record<string, unknown> = {
  country: "Belgium",
  currency: "EUR",
  workerType: "whiteCollar",
  contractType: "permanent",
  contractDurationMonths: 12,
  age: 30,
  education: "bachelor",
  degreeId: 1,
  workExperience: 5,
  civilStatus: "single",
  dependents: 0,
  sector: "IT",
  employeeCount: "51-200",
  multinational: false,
  publiclyListed: false,
  jobTitle: "Software Engineer",
  seniority: 3,
  jobDescription: "Builds internal tools",
  officialHours: 38,
  averageHours: 40,
  shiftDescription: "Day shift",
  onCall: "no",
  vacationDays: 20,
  salaryBasis: "both",
  grossSalary: 3500,
  netSalary: 2400,
  netCompensation: 2200,
  fixedGrossSalary: 3000,
  variableGrossSalary: 500,
  hourlyRate: 18,
  dayRate: 650,
  agencyCutPercent: 15,
  clientDayBudget: 800,
  bursaryAmount: 2500,
  virtualGrossSalary: 2800,
  thirteenthMonth: "Full",
  mealVouchers: 8,
  ecoCheques: 250,
  groupInsurance: "yes",
  hasCompanyCar: true,
  companyCarModel: "BMW i4",
  companyCarFuelType: "electric",
  companyCarCardScope: "belgium",
  hasEquity: false,
  otherInsurances: "Hospitalization",
  otherBenefits: "Gym membership",
  residenceCountry: "Belgium",
  workProvince: "Antwerp",
  workCity: "Brussels",
  commuteUnit: "km",
  commuteDistance: "15",
  commuteTimeMinutes: 30,
  commuteMethod: "car",
  commuteCompensation: "company car",
  teleworkDays: 2,
  reports: 3,
  dayOffEase: "easy",
  stressLevel: "moderate",
  jobSatisfaction: 8,
  extraNotes: "Some notes",
  honestyConfirmation: true,
};

/** Build a payload containing ONLY the fields the form renders for this combo. */
function fullVisiblePayload(country: string, workerType: string): Record<string, unknown> {
  const rendered = renderedFields(country, workerType);
  const payload: Record<string, unknown> = {};
  for (const name of rendered) {
    if (name === "benefits") {
      payload.benefits = [];
      continue;
    }
    if (name in VALID_VALUES) payload[name] = VALID_VALUES[name];
  }
  payload.country = country;
  payload.workerType = workerType;
  return payload;
}

describe("schema ⇄ rendered-fields consistency", () => {
  for (const country of COUNTRIES) {
    for (const workerType of WORKER_TYPES) {
      it(`a fully-filled VISIBLE ${country} / ${workerType} form validates (no hidden required field blocks submit)`, () => {
        const payload = fullVisiblePayload(country, workerType);
        const result = schema.safeParse(payload);
        if (!result.success) {
          throw new Error(
            `${country}/${workerType} could not submit despite every visible field being filled. ` +
              `Offending errors (these paths are required by the schema but not fillable on screen):\n` +
              result.error.issues.map((i) => `  ${i.path.join(".") || "(root)"}: ${i.message}`).join("\n")
          );
        }
        expect(result.success).toBe(true);
      });

      it(`every validation error for an empty ${country} / ${workerType} form targets a RENDERED field`, () => {
        // With almost nothing provided, every conditionally-required rule fires.
        // Each resulting error path must be a field the user can actually see;
        // otherwise the error is invisible and the submit is silent.
        const rendered = renderedFields(country, workerType);
        const result = schema.safeParse({ country, workerType });
        expect(result.success).toBe(false);
        if (result.success) return;
        const hiddenErrorPaths = result.error.issues
          .map((i) => String(i.path[0]))
          .filter((p) => p && !rendered.has(p));
        expect(
          hiddenErrorPaths,
          `These required/error paths are NOT rendered for ${country}/${workerType}, so their ` +
            `errors would be invisible and the submit would silently do nothing: [${[
              ...new Set(hiddenErrorPaths),
            ].join(", ")}]`
        ).toEqual([]);
      });
    }
  }
});

describe("regression: the two guaranteed silent-submit scenarios now pass", () => {
  it("Netherlands whiteCollar submits WITHOUT thirteenthMonth / groupInsurance (fields NL never renders)", () => {
    const payload = fullVisiblePayload("Netherlands", "whiteCollar");
    expect("thirteenthMonth" in payload).toBe(false);
    expect("groupInsurance" in payload).toBe(false);
    expect(schema.safeParse(payload).success).toBe(true);
  });

  it("Netherlands intern submits without the Belgian benefit columns", () => {
    expect(schema.safeParse(fullVisiblePayload("Netherlands", "intern")).success).toBe(true);
  });

  it("freelancer submits WITHOUT vacationDays (field is hidden for freelancers)", () => {
    for (const country of COUNTRIES) {
      const payload = fullVisiblePayload(country, "freelancer");
      expect("vacationDays" in payload).toBe(false);
      expect(schema.safeParse(payload).success, `${country} freelancer should submit`).toBe(true);
    }
  });
});

describe("salaried workers must provide BOTH gross and net (salary-basis selector removed)", () => {
  const baseWhiteCollar = {
    country: "Belgium",
    workerType: "whiteCollar",
    age: 30,
    education: "bachelor",
    workExperience: 5,
    civilStatus: "single",
    dependents: 0,
    sector: "IT",
    employeeCount: "51-200",
    multinational: false,
    jobTitle: "Engineer",
    seniority: 3,
    officialHours: 38,
    averageHours: 40,
    vacationDays: 20,
    currency: "EUR",
    thirteenthMonth: "Full",
    groupInsurance: "yes",
    commuteDistance: "15",
    commuteMethod: "car",
    commuteCompensation: "company car",
    teleworkDays: 2,
    dayOffEase: "easy",
    stressLevel: "moderate",
    honestyConfirmation: true,
  };

  it("no salary at all → both grossSalary AND netSalary error (both are rendered, so both are visible)", () => {
    const result = schema.safeParse(baseWhiteCollar);
    expect(result.success).toBe(false);
    if (result.success) return;
    const paths = result.error.issues.map((i) => i.path.join("."));
    expect(paths).toContain("grossSalary");
    expect(paths).toContain("netSalary");
  });

  it("gross only → still errors on the missing net", () => {
    const result = schema.safeParse({ ...baseWhiteCollar, grossSalary: 3500 });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.map((i) => i.path.join("."))).toContain("netSalary");
  });

  it("net only → still errors on the missing gross", () => {
    const result = schema.safeParse({ ...baseWhiteCollar, netSalary: 2400 });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.map((i) => i.path.join("."))).toContain("grossSalary");
  });

  it("both present → passes", () => {
    expect(schema.safeParse({ ...baseWhiteCollar, grossSalary: 3500, netSalary: 2400 }).success).toBe(
      true
    );
  });
});
