import { describe, it, expect } from "vitest";
import { createSalaryEntrySchema } from "../salary-entry.schema";

// Mock translator — returns the key so error messages are testable by key
const t = (key: string) => key;
const schema = createSalaryEntrySchema(t);

const pass = (data: unknown) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(
      "Expected valid but got errors:\n" +
        result.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n")
    );
  }
  return result.data;
};

const fail = (data: unknown, expectedPath?: string) => {
  const result = schema.safeParse(data);
  expect(result.success, "Expected validation to fail but it passed").toBe(false);
  if (expectedPath && !result.success) {
    const paths = result.error.issues.map((i) => i.path.join("."));
    expect(
      paths.some((p) => p === expectedPath || p.startsWith(expectedPath)),
      `Expected error on path "${expectedPath}" but got: [${paths.join(", ")}]`
    ).toBe(true);
  }
  return result;
};

// ---------------------------------------------------------------------------
// Minimal valid payloads for each worker type (Belgium)
// ---------------------------------------------------------------------------

const BASE_BE_WHITE_COLLAR = {
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
  thirteenthMonth: "full",
  groupInsurance: "yes",
  commuteDistance: "15",
  commuteMethod: "car",
  commuteCompensation: "company car",
  teleworkDays: 2,
  dayOffEase: "easy",
  stressLevel: "medium",
  honestyConfirmation: true,
};

const BASE_BE_BLUE_COLLAR = {
  ...BASE_BE_WHITE_COLLAR,
  workerType: "blueCollar",
  thirteenthMonth: undefined,
  groupInsurance: undefined,
  grossSalary: undefined,
  hourlyRate: 18,
};

const BASE_BE_FREELANCER = {
  ...BASE_BE_WHITE_COLLAR,
  workerType: "freelancer",
  thirteenthMonth: undefined,
  groupInsurance: undefined,
  grossSalary: undefined,
  dayRate: 650,
};

const BASE_BE_INTERN = {
  ...BASE_BE_WHITE_COLLAR,
  workerType: "intern",
};

const BASE_BE_PHD = {
  ...BASE_BE_WHITE_COLLAR,
  workerType: "phdResearcher",
  thirteenthMonth: undefined,
  groupInsurance: undefined,
  grossSalary: undefined,
  bursaryAmount: 2500,
};

const BASE_NL_WHITE_COLLAR = {
  ...BASE_BE_WHITE_COLLAR,
  country: "Netherlands",
  // NL doesn't require thirteenthMonth / groupInsurance via the schema — the
  // superRefine only targets SALARIED_WORKER_TYPES. The schema itself has no
  // per-country branching, so a Netherlands entry with these fields still passes.
};

// ---------------------------------------------------------------------------
// 1. Happy paths
// ---------------------------------------------------------------------------
describe("Happy paths", () => {
  it("passes for a minimal valid Belgium whiteCollar entry", () => {
    expect(pass(BASE_BE_WHITE_COLLAR)).toBeDefined();
  });

  it("passes for Belgium whiteCollar with netSalary instead of grossSalary", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, grossSalary: undefined, netSalary: 2400 });
  });

  it("passes for Belgium whiteCollar with netCompensation only", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, grossSalary: undefined, netCompensation: 2200 });
  });

  it("passes for Belgium blueCollar with hourlyRate", () => {
    pass(BASE_BE_BLUE_COLLAR);
  });

  it("passes for Belgium blueCollar with grossSalary (no hourlyRate)", () => {
    pass({ ...BASE_BE_BLUE_COLLAR, hourlyRate: undefined, grossSalary: 2800 });
  });

  it("passes for Belgium freelancer with dayRate", () => {
    pass(BASE_BE_FREELANCER);
  });

  it("passes for Belgium intern with all required fields", () => {
    pass(BASE_BE_INTERN);
  });

  it("passes for Belgium phdResearcher with bursaryAmount", () => {
    pass(BASE_BE_PHD);
  });

  it("passes for Belgium phdResearcher with virtualGrossSalary", () => {
    pass({ ...BASE_BE_PHD, bursaryAmount: undefined, virtualGrossSalary: 2800 });
  });

  it("passes for Belgium phdResearcher with grossSalary", () => {
    pass({ ...BASE_BE_PHD, bursaryAmount: undefined, grossSalary: 2800 });
  });

  it("passes for Netherlands whiteCollar entry", () => {
    pass(BASE_NL_WHITE_COLLAR);
  });

  it("passes with all optional fields populated", () => {
    pass({
      ...BASE_BE_WHITE_COLLAR,
      degreeId: 1,
      publiclyListed: true,
      jobDescription: "Builds and maintains internal tools",
      shiftDescription: "Day shift",
      onCall: "no",
      netCompensation: 0,
      salaryBasis: "gross",
      fixedGrossSalary: 3000,
      variableGrossSalary: 500,
      contractType: "permanent",
      hasCompanyCar: true,
      companyCarModel: "BMW i4",
      companyCarFuelType: "electric",
      companyCarCardScope: "belgium",
      hasEquity: false,
      locationGranularity: "city",
      workCity: "Brussels",
      workProvince: "Brussels-Capital",
      residenceCountry: "Belgium",
      commuteUnit: "km",
      commuteDistance: "10-25",
      commuteTimeMinutes: 30,
      mealVouchers: 8,
      ecoCheques: 250,
      otherInsurances: "Hospitalization insurance",
      otherBenefits: "gym allowance",
      teleworkDays: 3,
      jobSatisfaction: 8,
      reports: 3,
      extraNotes: "Includes shift premium",
    });
  });

  it("passes with benefits array", () => {
    pass({
      ...BASE_BE_WHITE_COLLAR,
      benefits: [
        { benefitKey: "meal_vouchers", valueNumeric: 8, currency: "EUR" },
        { benefitKey: "group_insurance", valueText: "yes" },
      ],
    });
  });

  it("passes when workerType is omitted (defaults to whiteCollar)", () => {
    const { workerType, ...withoutType } = BASE_BE_WHITE_COLLAR;
    pass(withoutType);
  });
});

// ---------------------------------------------------------------------------
// 2. Country
// ---------------------------------------------------------------------------
describe("country", () => {
  it("fails when country is missing", () => {
    const { country, ...data } = BASE_BE_WHITE_COLLAR;
    fail(data, "country");
  });

  it("fails when country is an empty string", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, country: "" }, "country");
  });

  it("passes for any non-empty country string (schema is not enum-locked)", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, country: "Germany" });
  });

  it("trims leading/trailing spaces from country", () => {
    const result = pass({ ...BASE_BE_WHITE_COLLAR, country: "  Belgium  " });
    expect(result.country).toBe("Belgium");
  });
});

// ---------------------------------------------------------------------------
// 3. Age
// ---------------------------------------------------------------------------
describe("age", () => {
  it("passes at minimum age 18", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, age: 18, workExperience: 0, seniority: 0 });
  });

  it("passes at maximum age 100", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, age: 100, workExperience: 30, seniority: 10 });
  });

  it("fails at age 17 (below minimum)", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, age: 17 }, "age");
  });

  it("fails at age 101 (above maximum)", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, age: 101 }, "age");
  });

  it("fails for non-integer age", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, age: 25.5 }, "age");
  });

  it("fails when age is 0", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, age: 0 }, "age");
  });

  it("fails when age is missing", () => {
    const { age, ...data } = BASE_BE_WHITE_COLLAR;
    fail(data, "age");
  });

  it("fails for negative age", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, age: -5 }, "age");
  });
});

// ---------------------------------------------------------------------------
// 4. Work experience
// ---------------------------------------------------------------------------
describe("workExperience", () => {
  it("passes at 0 years", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, workExperience: 0, seniority: 0 });
  });

  it("passes at maximum 82 years", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, age: 100, workExperience: 82, seniority: 10 });
  });

  it("fails above maximum 82 years", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, age: 100, workExperience: 83 }, "workExperience");
  });

  it("fails for non-integer workExperience", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, workExperience: 4.5 }, "workExperience");
  });

  it("fails when missing", () => {
    const { workExperience, ...data } = BASE_BE_WHITE_COLLAR;
    fail(data, "workExperience");
  });
});

// ---------------------------------------------------------------------------
// 5. Cross-check: workExperience vs age
// ---------------------------------------------------------------------------
describe("workExperience vs age cross-check", () => {
  it("passes when workExperience equals age - 16", () => {
    // age=30 → max experience = 14
    pass({ ...BASE_BE_WHITE_COLLAR, age: 30, workExperience: 14, seniority: 5 });
  });

  it("fails when workExperience exceeds age - 16", () => {
    // age=30 → max experience = 14; 15 > 14 → should fail
    fail({ ...BASE_BE_WHITE_COLLAR, age: 30, workExperience: 15, seniority: 5 }, "workExperience");
  });

  it("passes when workExperience is 0 and age is 18", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, age: 18, workExperience: 0, seniority: 0 });
  });

  it("fails when young age implies impossible experience", () => {
    // age=20, max experience = 4; submitting 5 fails
    fail({ ...BASE_BE_WHITE_COLLAR, age: 20, workExperience: 5, seniority: 2 }, "workExperience");
  });
});

// ---------------------------------------------------------------------------
// 6. Seniority
// ---------------------------------------------------------------------------
describe("seniority", () => {
  it("passes at 0 seniority", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, seniority: 0 });
  });

  it("passes at maximum seniority 50", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, age: 80, workExperience: 50, seniority: 50 });
  });

  it("fails above maximum seniority 50", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, age: 80, workExperience: 60, seniority: 51 }, "seniority");
  });

  it("fails for non-integer seniority", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, seniority: 2.5 }, "seniority");
  });

  it("fails when seniority exceeds workExperience", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, workExperience: 5, seniority: 6 }, "seniority");
  });

  it("passes when seniority equals workExperience", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, workExperience: 5, seniority: 5 });
  });

  it("fails when seniority is missing", () => {
    const { seniority, ...data } = BASE_BE_WHITE_COLLAR;
    fail(data, "seniority");
  });
});

// ---------------------------------------------------------------------------
// 7. Salary — whiteCollar / intern (at least one of gross/net/netCompensation)
// ---------------------------------------------------------------------------
describe("salary — whiteCollar requires at least one salary", () => {
  it("fails when all salary fields are absent", () => {
    fail(
      {
        ...BASE_BE_WHITE_COLLAR,
        grossSalary: undefined,
        netSalary: undefined,
        netCompensation: undefined,
      },
      "grossSalary"
    );
  });

  it("fails when grossSalary is 0 (must be positive)", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, grossSalary: 0 }, "grossSalary");
  });

  it("fails when grossSalary is negative", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, grossSalary: -100 }, "grossSalary");
  });

  it("passes with only grossSalary", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, netSalary: undefined, netCompensation: undefined });
  });

  it("passes with only netSalary", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, grossSalary: undefined, netSalary: 2200 });
  });

  it("passes with only netCompensation", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, grossSalary: undefined, netCompensation: 2200 });
  });

  it("passes with all three salary fields set", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, netSalary: 2200, netCompensation: 2300 });
  });
});

describe("salary — intern requires at least one salary", () => {
  it("fails when all salary fields absent for intern", () => {
    fail(
      {
        ...BASE_BE_INTERN,
        grossSalary: undefined,
        netSalary: undefined,
        netCompensation: undefined,
      },
      "grossSalary"
    );
  });
});

// ---------------------------------------------------------------------------
// 8. Salary — freelancer (dayRate required)
// ---------------------------------------------------------------------------
describe("salary — freelancer", () => {
  it("fails when dayRate is missing", () => {
    fail({ ...BASE_BE_FREELANCER, dayRate: undefined }, "dayRate");
  });

  it("passes with dayRate set", () => {
    pass(BASE_BE_FREELANCER);
  });

  it("passes with dayRate and optional clientDayBudget", () => {
    pass({ ...BASE_BE_FREELANCER, clientDayBudget: 800, agencyCutPercent: 15 });
  });
});

// ---------------------------------------------------------------------------
// 9. Salary — blueCollar (hourlyRate OR any gross/net salary required)
// ---------------------------------------------------------------------------
describe("salary — blueCollar", () => {
  it("fails when no hourlyRate and no salary fields", () => {
    fail(
      {
        ...BASE_BE_BLUE_COLLAR,
        hourlyRate: undefined,
        grossSalary: undefined,
        netSalary: undefined,
        netCompensation: undefined,
      },
      "hourlyRate"
    );
  });

  it("passes with hourlyRate only", () => {
    pass(BASE_BE_BLUE_COLLAR);
  });

  it("passes with grossSalary only (no hourlyRate)", () => {
    pass({ ...BASE_BE_BLUE_COLLAR, hourlyRate: undefined, grossSalary: 2600 });
  });

  it("passes with netSalary only (no hourlyRate)", () => {
    pass({
      ...BASE_BE_BLUE_COLLAR,
      hourlyRate: undefined,
      grossSalary: undefined,
      netSalary: 2000,
    });
  });

  it("passes with both hourlyRate and grossSalary", () => {
    pass({ ...BASE_BE_BLUE_COLLAR, grossSalary: 2600 });
  });
});

// ---------------------------------------------------------------------------
// 10. Salary — phdResearcher (bursaryAmount OR virtualGrossSalary OR gross/net)
// ---------------------------------------------------------------------------
describe("salary — phdResearcher", () => {
  it("fails when no compensation field is set", () => {
    fail(
      {
        ...BASE_BE_PHD,
        bursaryAmount: undefined,
        virtualGrossSalary: undefined,
        grossSalary: undefined,
        netSalary: undefined,
        netCompensation: undefined,
      },
      "bursaryAmount"
    );
  });

  it("passes with bursaryAmount only", () => {
    pass(BASE_BE_PHD);
  });

  it("passes with virtualGrossSalary only", () => {
    pass({ ...BASE_BE_PHD, bursaryAmount: undefined, virtualGrossSalary: 2800 });
  });

  it("passes with grossSalary only", () => {
    pass({ ...BASE_BE_PHD, bursaryAmount: undefined, grossSalary: 2800 });
  });
});

// ---------------------------------------------------------------------------
// 11. Benefits — thirteenthMonth and groupInsurance required for whiteCollar/intern
// ---------------------------------------------------------------------------
describe("thirteenthMonth and groupInsurance for salaried types", () => {
  it("fails when thirteenthMonth is missing for whiteCollar", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, thirteenthMonth: undefined }, "thirteenthMonth");
  });

  it("fails when groupInsurance is missing for whiteCollar", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, groupInsurance: undefined }, "groupInsurance");
  });

  it("fails when thirteenthMonth is missing for intern", () => {
    fail({ ...BASE_BE_INTERN, thirteenthMonth: undefined }, "thirteenthMonth");
  });

  it("fails when groupInsurance is missing for intern", () => {
    fail({ ...BASE_BE_INTERN, groupInsurance: undefined }, "groupInsurance");
  });

  it("does NOT require thirteenthMonth for blueCollar", () => {
    pass({ ...BASE_BE_BLUE_COLLAR, thirteenthMonth: undefined });
  });

  it("does NOT require groupInsurance for blueCollar", () => {
    pass({ ...BASE_BE_BLUE_COLLAR, groupInsurance: undefined });
  });

  it("does NOT require thirteenthMonth for freelancer", () => {
    pass({ ...BASE_BE_FREELANCER, thirteenthMonth: undefined });
  });

  it("does NOT require groupInsurance for freelancer", () => {
    pass({ ...BASE_BE_FREELANCER, groupInsurance: undefined });
  });

  it("does NOT require thirteenthMonth for phdResearcher", () => {
    pass({ ...BASE_BE_PHD, thirteenthMonth: undefined });
  });
});

// ---------------------------------------------------------------------------
// 12. Working hours
// ---------------------------------------------------------------------------
describe("officialHours", () => {
  it("passes at minimum 1 hour", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, officialHours: 1 });
  });

  it("passes at maximum 80 hours", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, officialHours: 80 });
  });

  it("passes at 40.5 hours (valid 0.5 step)", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, officialHours: 40.5 });
  });

  it("fails at 0 hours", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, officialHours: 0 }, "officialHours");
  });

  it("fails at 81 hours", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, officialHours: 81 }, "officialHours");
  });

  it("fails at 40.3 hours (not a 0.5 step)", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, officialHours: 40.3 }, "officialHours");
  });

  it("fails when missing", () => {
    const { officialHours, ...data } = BASE_BE_WHITE_COLLAR;
    fail(data, "officialHours");
  });
});

describe("averageHours", () => {
  it("passes at 38 hours", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, averageHours: 38 });
  });

  it("fails at 0 hours", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, averageHours: 0 }, "averageHours");
  });

  it("fails at 80.5 hours (over max)", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, averageHours: 80.5 }, "averageHours");
  });

  it("fails at non-0.5-step hours", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, averageHours: 37.7 }, "averageHours");
  });

  it("fails when missing", () => {
    const { averageHours, ...data } = BASE_BE_WHITE_COLLAR;
    fail(data, "averageHours");
  });
});

// ---------------------------------------------------------------------------
// 13. Vacation days
// ---------------------------------------------------------------------------
describe("vacationDays", () => {
  it("passes at 0 days", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, vacationDays: 0 });
  });

  it("passes at 365 days", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, vacationDays: 365 });
  });

  it("fails above 365 days", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, vacationDays: 366 }, "vacationDays");
  });

  it("passes at 20.5 days (0.5 step)", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, vacationDays: 20.5 });
  });

  it("fails at 20.3 days (not a 0.5 step)", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, vacationDays: 20.3 }, "vacationDays");
  });

  it("fails when missing", () => {
    const { vacationDays, ...data } = BASE_BE_WHITE_COLLAR;
    fail(data, "vacationDays");
  });
});

// ---------------------------------------------------------------------------
// 14. Commute distance format
// ---------------------------------------------------------------------------
describe("commuteDistance", () => {
  it("passes a single integer", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, commuteDistance: "25" });
  });

  it("passes a single decimal", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, commuteDistance: "12.5" });
  });

  it("passes a range like 10-30", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, commuteDistance: "10-30" });
  });

  it("passes a decimal range like 5.5-12.5", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, commuteDistance: "5.5-12.5" });
  });

  it("passes zero distance", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, commuteDistance: "0" });
  });

  it("fails for alphabetic value", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, commuteDistance: "far" }, "commuteDistance");
  });

  it("fails for trailing dash (10-)", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, commuteDistance: "10-" }, "commuteDistance");
  });

  it("fails for leading dash (-10)", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, commuteDistance: "-10" }, "commuteDistance");
  });

  it("fails for mixed text (10 km)", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, commuteDistance: "10 km" }, "commuteDistance");
  });

  it("fails when missing", () => {
    const { commuteDistance, ...data } = BASE_BE_WHITE_COLLAR;
    fail(data, "commuteDistance");
  });

  it("fails when over 50 chars", () => {
    fail(
      { ...BASE_BE_WHITE_COLLAR, commuteDistance: "1".repeat(51) },
      "commuteDistance"
    );
  });
});

// ---------------------------------------------------------------------------
// 15. Commute method and compensation
// ---------------------------------------------------------------------------
describe("commuteMethod", () => {
  it("fails when missing", () => {
    const { commuteMethod, ...data } = BASE_BE_WHITE_COLLAR;
    fail(data, "commuteMethod");
  });

  it("fails for empty string", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, commuteMethod: "" }, "commuteMethod");
  });

  it("passes for any non-empty string", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, commuteMethod: "public transport" });
  });
});

describe("commuteCompensation", () => {
  it("fails when missing", () => {
    const { commuteCompensation, ...data } = BASE_BE_WHITE_COLLAR;
    fail(data, "commuteCompensation");
  });

  it("fails for empty string", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, commuteCompensation: "" }, "commuteCompensation");
  });

  it("fails when over 1000 characters", () => {
    fail(
      { ...BASE_BE_WHITE_COLLAR, commuteCompensation: "a".repeat(1001) },
      "commuteCompensation"
    );
  });

  it("fails when commuteCompensation IS a bare URL", () => {
    fail(
      { ...BASE_BE_WHITE_COLLAR, commuteCompensation: "https://example.com" },
      "commuteCompensation"
    );
  });

  it("fails when commuteCompensation contains an embedded URL", () => {
    fail(
      { ...BASE_BE_WHITE_COLLAR, commuteCompensation: "reimbursed, see https://example.com" },
      "commuteCompensation"
    );
  });
});

// ---------------------------------------------------------------------------
// 16. Telework days
// ---------------------------------------------------------------------------
describe("teleworkDays", () => {
  it("passes at 0 days", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, teleworkDays: 0 });
  });

  it("passes at 7 days", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, teleworkDays: 7 });
  });

  it("fails above 7 days", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, teleworkDays: 8 }, "teleworkDays");
  });

  it("passes at 3.5 days (0.5 step)", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, teleworkDays: 3.5 });
  });

  it("fails at 3.3 days (not a 0.5 step)", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, teleworkDays: 3.3 }, "teleworkDays");
  });

  it("fails when missing", () => {
    const { teleworkDays, ...data } = BASE_BE_WHITE_COLLAR;
    fail(data, "teleworkDays");
  });
});

// ---------------------------------------------------------------------------
// 17. Work-life balance fields
// ---------------------------------------------------------------------------
describe("dayOffEase and stressLevel", () => {
  it("fails when dayOffEase is missing", () => {
    const { dayOffEase, ...data } = BASE_BE_WHITE_COLLAR;
    fail(data, "dayOffEase");
  });

  it("fails when stressLevel is missing", () => {
    const { stressLevel, ...data } = BASE_BE_WHITE_COLLAR;
    fail(data, "stressLevel");
  });

  it("fails when dayOffEase is empty string", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, dayOffEase: "" }, "dayOffEase");
  });

  it("fails when stressLevel is empty string", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, stressLevel: "" }, "stressLevel");
  });
});

// ---------------------------------------------------------------------------
// 18. Honesty confirmation
// ---------------------------------------------------------------------------
describe("honestyConfirmation", () => {
  it("fails when false", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, honestyConfirmation: false }, "honestyConfirmation");
  });

  it("fails when missing", () => {
    const { honestyConfirmation, ...data } = BASE_BE_WHITE_COLLAR;
    fail(data, "honestyConfirmation");
  });

  it("passes when true", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, honestyConfirmation: true });
  });
});

// ---------------------------------------------------------------------------
// 19. URL rejection in text fields
//
// noUrls() rejects both bare URLs (the whole value is a URL) AND embedded URLs
// (a URL appears anywhere inside the text). Ordinary text containing dots or
// abbreviations (e.g., i.e., 9.00) is still allowed.
// ---------------------------------------------------------------------------
describe("URL rejection — bare URLs (whole value is a URL)", () => {
  it("fails when jobTitle IS a bare URL", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, jobTitle: "https://spam.com" }, "jobTitle");
  });

  it("fails when jobTitle IS a bare http URL", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, jobTitle: "http://spam.com" }, "jobTitle");
  });

  it("fails when shiftDescription IS a bare URL", () => {
    fail(
      { ...BASE_BE_WHITE_COLLAR, shiftDescription: "https://rota.example.com" },
      "shiftDescription"
    );
  });

  it("fails when otherInsurances IS a bare URL", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, otherInsurances: "https://insurer.be" }, "otherInsurances");
  });

  it("fails when otherBenefits IS a bare URL", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, otherBenefits: "https://gym.be" }, "otherBenefits");
  });

  it("fails when extraNotes IS a bare URL", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, extraNotes: "https://info.example.com" }, "extraNotes");
  });

  it("fails when jobDescription IS a bare URL", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, jobDescription: "https://jobs.example.com" }, "jobDescription");
  });
});

describe("URL rejection — embedded URLs are rejected", () => {
  it("fails when jobTitle contains an embedded https URL", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, jobTitle: "See https://example.com" }, "jobTitle");
  });

  it("fails when jobDescription contains an embedded https URL", () => {
    fail(
      { ...BASE_BE_WHITE_COLLAR, jobDescription: "Check out https://jobs.example.com" },
      "jobDescription"
    );
  });

  it("fails when otherBenefits contains an embedded https URL", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, otherBenefits: "Discount at https://gym.be" }, "otherBenefits");
  });

  it("fails when extraNotes contains an embedded https URL", () => {
    fail(
      { ...BASE_BE_WHITE_COLLAR, extraNotes: "More info: https://info.example.com" },
      "extraNotes"
    );
  });

  it("fails when otherInsurances contains an embedded http (insecure) URL", () => {
    fail(
      { ...BASE_BE_WHITE_COLLAR, otherInsurances: "old policy http://legacy.insurer.be" },
      "otherInsurances"
    );
  });

  it("fails when a field contains a www. host without a protocol", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, extraNotes: "visit www.example.com for details" }, "extraNotes");
  });
});

describe("URL rejection — legitimate text with dots is still allowed", () => {
  it("allows abbreviations like e.g. and i.e.", () => {
    pass({
      ...BASE_BE_WHITE_COLLAR,
      jobDescription: "Manages the backend, i.e. APIs and databases, e.g. Postgres.",
    });
  });

  it("allows numeric ranges with decimals", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, extraNotes: "Works 9.00 to 17.00 with flexible hours." });
  });

  it("allows 'etc.' at the end of a sentence", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, otherBenefits: "Free coffee, snacks, gym access, etc." });
  });
});

// ---------------------------------------------------------------------------
// 20. String maximum lengths
// ---------------------------------------------------------------------------
describe("string length limits", () => {
  it("fails when jobTitle exceeds 200 characters", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, jobTitle: "A".repeat(201) }, "jobTitle");
  });

  it("passes when jobTitle is exactly 200 characters", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, jobTitle: "A".repeat(200) });
  });

  it("fails when jobDescription exceeds 5000 characters", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, jobDescription: "A".repeat(5001) }, "jobDescription");
  });

  it("fails when shiftDescription exceeds 1000 characters", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, shiftDescription: "A".repeat(1001) }, "shiftDescription");
  });

  it("fails when otherInsurances exceeds 2000 characters", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, otherInsurances: "A".repeat(2001) }, "otherInsurances");
  });

  it("fails when otherBenefits exceeds 2000 characters", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, otherBenefits: "A".repeat(2001) }, "otherBenefits");
  });

  it("fails when extraNotes exceeds 5000 characters", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, extraNotes: "A".repeat(5001) }, "extraNotes");
  });

  it("fails when companyCarModel exceeds 120 characters", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, companyCarModel: "A".repeat(121) }, "companyCarModel");
  });

  it("fails when workCity exceeds 200 characters", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, workCity: "A".repeat(201) }, "workCity");
  });
});

// ---------------------------------------------------------------------------
// 21. Meal vouchers and eco cheques
// ---------------------------------------------------------------------------
describe("mealVouchers", () => {
  it("passes at 0", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, mealVouchers: 0 });
  });

  it("passes at maximum 12", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, mealVouchers: 12 });
  });

  it("fails above 12", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, mealVouchers: 13 }, "mealVouchers");
  });
});

describe("ecoCheques", () => {
  it("passes at 0", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, ecoCheques: 0 });
  });

  it("passes at maximum 10000", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, ecoCheques: 10000 });
  });

  it("fails above 10000", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, ecoCheques: 10001 }, "ecoCheques");
  });
});

// ---------------------------------------------------------------------------
// 22. Reports
// ---------------------------------------------------------------------------
describe("reports", () => {
  it("passes at 0", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, reports: 0 });
  });

  it("passes at maximum 1000", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, reports: 1000 });
  });

  it("fails above 1000", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, reports: 1001 }, "reports");
  });

  it("fails for non-integer reports", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, reports: 2.5 }, "reports");
  });

  it("is optional — passes when missing", () => {
    const { reports, ...data } = { ...BASE_BE_WHITE_COLLAR, reports: 3 };
    pass(data);
  });
});

// ---------------------------------------------------------------------------
// 23. Job satisfaction
// ---------------------------------------------------------------------------
describe("jobSatisfaction (optional)", () => {
  it("passes at 0", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, jobSatisfaction: 0 });
  });

  it("passes at 10", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, jobSatisfaction: 10 });
  });

  it("fails above 10", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, jobSatisfaction: 11 }, "jobSatisfaction");
  });

  it("fails for non-integer value", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, jobSatisfaction: 7.5 }, "jobSatisfaction");
  });

  it("is optional — passes when absent", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, jobSatisfaction: undefined });
  });
});

// ---------------------------------------------------------------------------
// 24. Contract type enum
// ---------------------------------------------------------------------------
describe("contractType", () => {
  it("passes for 'permanent'", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, contractType: "permanent" });
  });

  it("passes for 'fixedTerm'", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, contractType: "fixedTerm" });
  });

  it("passes for 'interim'", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, contractType: "interim" });
  });

  it("passes for 'internship'", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, contractType: "internship" });
  });

  it("passes for 'freelance'", () => {
    pass({ ...BASE_BE_FREELANCER, contractType: "freelance" });
  });

  it("fails for an unknown contractType", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, contractType: "gig" }, "contractType");
  });

  it("is optional — passes when absent", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, contractType: undefined });
  });
});

// ---------------------------------------------------------------------------
// 25. Salary basis enum
// ---------------------------------------------------------------------------
describe("salaryBasis", () => {
  it("passes for 'gross'", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, salaryBasis: "gross" });
  });

  it("passes for 'net'", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, grossSalary: undefined, netSalary: 2200, salaryBasis: "net" });
  });

  it("passes for 'both'", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, netSalary: 2200, salaryBasis: "both" });
  });

  it("fails for invalid value", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, salaryBasis: "hourly" }, "salaryBasis");
  });
});

// ---------------------------------------------------------------------------
// 26. Company car fuel type and card scope enums
// ---------------------------------------------------------------------------
describe("company car enums", () => {
  it("passes for electric fuel type", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, hasCompanyCar: true, companyCarFuelType: "electric" });
  });

  it("passes for hybrid fuel type", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, hasCompanyCar: true, companyCarFuelType: "hybrid" });
  });

  it("passes for fuel type 'fuel'", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, hasCompanyCar: true, companyCarFuelType: "fuel" });
  });

  it("fails for unknown fuel type", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, hasCompanyCar: true, companyCarFuelType: "diesel" }, "companyCarFuelType");
  });

  it("passes for card scope 'belgium'", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, hasCompanyCar: true, companyCarCardScope: "belgium" });
  });

  it("passes for card scope 'europe'", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, hasCompanyCar: true, companyCarCardScope: "europe" });
  });

  it("fails for unknown card scope", () => {
    fail(
      { ...BASE_BE_WHITE_COLLAR, hasCompanyCar: true, companyCarCardScope: "worldwide" },
      "companyCarCardScope"
    );
  });
});

// ---------------------------------------------------------------------------
// 27. Location granularity enum
// ---------------------------------------------------------------------------
describe("locationGranularity", () => {
  it("passes for 'country'", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, locationGranularity: "country" });
  });

  it("passes for 'province'", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, locationGranularity: "province" });
  });

  it("passes for 'city'", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, locationGranularity: "city" });
  });

  it("fails for unknown granularity", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, locationGranularity: "street" }, "locationGranularity");
  });
});

// ---------------------------------------------------------------------------
// 28. Required personal + employer fields
// ---------------------------------------------------------------------------
describe("required personal fields", () => {
  it("fails when education is missing", () => {
    const { education, ...data } = BASE_BE_WHITE_COLLAR;
    fail(data, "education");
  });

  it("fails when civilStatus is missing", () => {
    const { civilStatus, ...data } = BASE_BE_WHITE_COLLAR;
    fail(data, "civilStatus");
  });

  it("fails when dependents is missing", () => {
    const { dependents, ...data } = BASE_BE_WHITE_COLLAR;
    fail(data, "dependents");
  });

  it("fails when dependents is negative", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, dependents: -1 }, "dependents");
  });

  it("fails when dependents exceeds 20", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, dependents: 21 }, "dependents");
  });

  it("passes at maximum 20 dependents", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, dependents: 20 });
  });
});

describe("required employer fields", () => {
  it("fails when sector is missing", () => {
    const { sector, ...data } = BASE_BE_WHITE_COLLAR;
    fail(data, "sector");
  });

  it("fails when sector is empty string", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, sector: "" }, "sector");
  });

  it("fails when employeeCount is missing", () => {
    const { employeeCount, ...data } = BASE_BE_WHITE_COLLAR;
    fail(data, "employeeCount");
  });

  it("fails when employeeCount is empty string", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, employeeCount: "" }, "employeeCount");
  });

  it("fails when multinational is missing", () => {
    const { multinational, ...data } = BASE_BE_WHITE_COLLAR;
    fail(data, "multinational");
  });
});

// ---------------------------------------------------------------------------
// 29. Currency
// ---------------------------------------------------------------------------
describe("currency", () => {
  it("fails when currency is missing", () => {
    const { currency, ...data } = BASE_BE_WHITE_COLLAR;
    fail(data, "currency");
  });

  it("fails when currency is empty string", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, currency: "" }, "currency");
  });

  it("passes for EUR", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, currency: "EUR" });
  });

  it("passes for USD", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, currency: "USD" });
  });
});

// ---------------------------------------------------------------------------
// 30. String trimming (preprocessing)
// ---------------------------------------------------------------------------
describe("string trimming via preprocess", () => {
  it("trims whitespace from jobTitle", () => {
    const result = pass({ ...BASE_BE_WHITE_COLLAR, jobTitle: "  Software Engineer  " });
    expect(result.jobTitle).toBe("Software Engineer");
  });

  it("trims whitespace from sector", () => {
    const result = pass({ ...BASE_BE_WHITE_COLLAR, sector: "  Finance  " });
    expect(result.sector).toBe("Finance");
  });

  it("makes jobTitle empty after trimming space-only → fails", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, jobTitle: "   " }, "jobTitle");
  });
});

// ---------------------------------------------------------------------------
// 31. contractDurationMonths (optional, valid range)
// ---------------------------------------------------------------------------
describe("contractDurationMonths", () => {
  it("passes with 0 months", () => {
    pass({
      ...BASE_BE_WHITE_COLLAR,
      contractType: "fixedTerm",
      contractDurationMonths: 0,
    });
  });

  it("passes with 600 months (max)", () => {
    pass({
      ...BASE_BE_WHITE_COLLAR,
      contractType: "fixedTerm",
      contractDurationMonths: 600,
    });
  });

  it("fails above 600 months", () => {
    fail(
      { ...BASE_BE_WHITE_COLLAR, contractType: "fixedTerm", contractDurationMonths: 601 },
      "contractDurationMonths"
    );
  });

  it("is optional — passes when absent", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, contractDurationMonths: undefined });
  });
});

// ---------------------------------------------------------------------------
// 32. jobTitle is required and non-empty
// ---------------------------------------------------------------------------
describe("jobTitle", () => {
  it("fails when missing", () => {
    const { jobTitle, ...data } = BASE_BE_WHITE_COLLAR;
    fail(data, "jobTitle");
  });

  it("fails for empty string", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, jobTitle: "" }, "jobTitle");
  });

  it("passes for a normal title", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, jobTitle: "Lead Developer" });
  });
});

// ---------------------------------------------------------------------------
// 33. Netherlands — no Belgium-specific column requirements beyond schema
// ---------------------------------------------------------------------------
describe("Netherlands specifics", () => {
  it("passes a full NL whiteCollar entry", () => {
    pass(BASE_NL_WHITE_COLLAR);
  });

  it("passes NL without thirteenthMonth and groupInsurance (schema is not NL-specific)", () => {
    // Schema doesn't carve out NL; salaried check still applies. Provide them.
    pass({ ...BASE_NL_WHITE_COLLAR, thirteenthMonth: "none", groupInsurance: "no" });
  });

  it("passes NL freelancer with dayRate", () => {
    pass({
      ...BASE_BE_FREELANCER,
      country: "Netherlands",
    });
  });

  it("passes NL blueCollar with hourlyRate", () => {
    pass({
      ...BASE_BE_BLUE_COLLAR,
      country: "Netherlands",
    });
  });
});

// ---------------------------------------------------------------------------
// 34. Commuteunit enum
// ---------------------------------------------------------------------------
describe("commuteUnit", () => {
  it("passes for 'km'", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, commuteUnit: "km" });
  });

  it("passes for 'minutes'", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, commuteUnit: "minutes" });
  });

  it("fails for unknown unit", () => {
    fail({ ...BASE_BE_WHITE_COLLAR, commuteUnit: "miles" }, "commuteUnit");
  });

  it("is optional — passes when absent", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, commuteUnit: undefined });
  });
});

// ---------------------------------------------------------------------------
// 35. benefits array structure
// ---------------------------------------------------------------------------
describe("benefits array", () => {
  it("passes with empty array", () => {
    pass({ ...BASE_BE_WHITE_COLLAR, benefits: [] });
  });

  it("passes with a valid benefit entry", () => {
    pass({
      ...BASE_BE_WHITE_COLLAR,
      benefits: [{ benefitKey: "thirteenth_month", valueText: "full" }],
    });
  });

  it("fails when a benefit entry has an empty benefitKey", () => {
    fail(
      { ...BASE_BE_WHITE_COLLAR, benefits: [{ benefitKey: "" }] },
      "benefits"
    );
  });

  it("fails when benefit valueText exceeds 500 chars", () => {
    fail(
      {
        ...BASE_BE_WHITE_COLLAR,
        benefits: [{ benefitKey: "meal", valueText: "A".repeat(501) }],
      },
      "benefits"
    );
  });

  it("passes when benefits is omitted", () => {
    const { benefits, ...data } = { ...BASE_BE_WHITE_COLLAR, benefits: [] };
    pass(data);
  });
});
