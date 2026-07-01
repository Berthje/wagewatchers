import { describe, it, expect } from "vitest";
import { validateSalaryEntryPayload } from "../salary-entry.schema";

/**
 * Server-side guard tests.
 *
 * The comprehensive form validation runs in the browser (react-hook-form +
 * createSalaryEntrySchema). validateSalaryEntryPayload re-runs the same rules on
 * the API so a scripted POST / disabled JS / stale client can't insert an entry
 * that skips required fields — most notably a salaried entry with NO gross
 * salary, which used to store NULL and render as "N/A" in the admin queue.
 */

// A complete, valid Belgium white-collar payload — mirrors exactly what the
// add form submits after passing client validation (including the extra
// `source` key the client tacks on before POSTing).
const VALID_BE_WHITE_COLLAR = {
  country: "Belgium",
  workerType: "whiteCollar",
  age: 30,
  education: "bachelor",
  workExperience: 5,
  civilStatus: "single",
  dependents: 0,
  sector: "IT",
  employeeCount: "50-249",
  multinational: false,
  jobTitle: "Software Engineer",
  seniority: 3,
  officialHours: 38,
  averageHours: 40,
  vacationDays: 20,
  currency: "EUR",
  grossSalary: 3500,
  netSalary: 2400,
  thirteenthMonth: "full",
  groupInsurance: "yes",
  commuteDistance: "15",
  commuteMethod: "car",
  commuteCompensation: "company car",
  teleworkDays: 2,
  dayOffEase: "easy",
  stressLevel: "medium",
  honestyConfirmation: true,
  // Server-only extras the client adds; the schema strips these and must not
  // reject because of them.
  source: "Manual submission",
};

describe("validateSalaryEntryPayload (server guard)", () => {
  it("accepts a complete valid white-collar payload", () => {
    const result = validateSalaryEntryPayload(VALID_BE_WHITE_COLLAR);
    expect(result.success).toBe(true);
  });

  it("rejects a white-collar payload with NO gross salary", () => {
    const result = validateSalaryEntryPayload({
      ...VALID_BE_WHITE_COLLAR,
      grossSalary: undefined,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors.grossSalary).toBeDefined();
    }
  });

  it("rejects a white-collar payload with an empty-string gross salary", () => {
    const result = validateSalaryEntryPayload({
      ...VALID_BE_WHITE_COLLAR,
      grossSalary: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a payload missing a required non-salary field (jobTitle)", () => {
    const result = validateSalaryEntryPayload({
      ...VALID_BE_WHITE_COLLAR,
      jobTitle: undefined,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a completely empty payload", () => {
    const result = validateSalaryEntryPayload({});
    expect(result.success).toBe(false);
  });

  it("rejects a non-object payload", () => {
    expect(validateSalaryEntryPayload(null).success).toBe(false);
    expect(validateSalaryEntryPayload("nope").success).toBe(false);
  });

  it("accepts a freelancer with a day rate but no gross salary", () => {
    const result = validateSalaryEntryPayload({
      ...VALID_BE_WHITE_COLLAR,
      workerType: "freelancer",
      thirteenthMonth: undefined,
      groupInsurance: undefined,
      grossSalary: undefined,
      netSalary: undefined,
      vacationDays: undefined,
      dayRate: 650,
    });
    expect(result.success).toBe(true);
  });
});
