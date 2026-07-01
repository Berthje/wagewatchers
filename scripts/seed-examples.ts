import { db } from "../src/lib/db";
import { salaryEntries, entryBenefits } from "../src/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { persistEntryBenefits, type SubmittedBenefit } from "../src/lib/entry-benefits";

/**
 * DEV-ONLY: seed a handful of rich v2 example entries showcasing the new
 * structure (worker types, structured comp, company car, equity, catalog
 * benefits, cross-border, Netherlands). Tagged source = "example-seed-v2" so
 * they are easy to find and are wiped + re-inserted on each run (idempotent).
 *
 *   tsx scripts/run-with-dev-db.ts tsx scripts/seed-examples.ts
 */
const SOURCE = "example-seed-v2";

type Example = {
  entry: typeof salaryEntries.$inferInsert;
  benefits: SubmittedBenefit[];
};

const examples: Example[] = [
  // 1) FAANG software engineer — Google Belgium, equity + company car + variable
  {
    entry: {
      source: SOURCE,
      entryVersion: 2,
      workerType: "whiteCollar",
      contractType: "permanent",
      country: "Belgium",
      workCity: "Brussels",
      workProvince: "Brussels-Capital",
      locationGranularity: "city",
      commuteUnit: "minutes",
      commuteDistance: "35",
      commuteMethod: "Train",
      commuteCompensation: "Full",
      age: 31,
      education: "master",
      degreeId: 2, // Burgerlijk ingenieur — computerwetenschappen
      workExperience: 7,
      seniority: 3,
      civilStatus: "cohabiting",
      dependents: 0,
      sector: "Technology/SaaS",
      employeeCount: "100k-500k",
      multinational: true,
      jobTitle: "Senior Software Engineer (FAANG)",
      currency: "EUR",
      salaryBasis: "both",
      grossSalary: 7800,
      netSalary: 4300,
      fixedGrossSalary: 7200,
      variableGrossSalary: 600,
      thirteenthMonth: "Full",
      mealVouchers: 8,
      groupInsurance: "yes",
      hasCompanyCar: true,
      companyCarModel: "BMW i4",
      companyCarFuelType: "electric",
      companyCarCardScope: "europe",
      hasEquity: true,
      officialHours: 40,
      averageHours: 45,
      vacationDays: 26,
      teleworkDays: 2,
      dayOffEase: "easy",
      stressLevel: "high",
      reviewStatus: "APPROVED",
      isManualEntry: true,
      extraNotes: "Example persona: big-tech software engineer with RSUs.",
    },
    benefits: [
      {
        benefitKey: "equity",
        valueNumeric: 45000,
        valueText: "RSU, 4-year vest (25%/yr)",
        currency: "EUR",
      },
      {
        benefitKey: "bonus",
        valueNumeric: 14000,
        valueText: "Annual performance bonus",
        currency: "EUR",
      },
      { benefitKey: "hospitalizationInsurance" },
      { benefitKey: "ipCopyrightRemuneration", valueNumeric: 11000, currency: "EUR" },
      { benefitKey: "homeworkingAllowance", valueNumeric: 130, currency: "EUR" },
      { benefitKey: "laptop" },
      { benefitKey: "phone" },
    ],
  },

  // 2) Freelancer — DevOps consultant via agency, day rate + agency cut
  {
    entry: {
      source: SOURCE,
      entryVersion: 2,
      workerType: "freelancer",
      contractType: "freelance",
      country: "Belgium",
      workCity: "Antwerp",
      workProvince: "Antwerp",
      locationGranularity: "city",
      commuteUnit: "km",
      commuteDistance: "20",
      commuteMethod: "Car",
      commuteCompensation: "None",
      age: 38,
      education: "master",
      degreeId: 20, // Master computerwetenschappen
      workExperience: 14,
      seniority: 5,
      civilStatus: "married",
      dependents: 2,
      sector: "IT",
      employeeCount: "1k-5k",
      multinational: true,
      jobTitle: "Freelance DevOps Consultant",
      currency: "EUR",
      dayRate: 650,
      agencyCutPercent: 12,
      clientDayBudget: 740,
      hasCompanyCar: false,
      hasEquity: false,
      officialHours: 40,
      averageHours: 42,
      teleworkDays: 3,
      dayOffEase: "moderate",
      stressLevel: "moderate",
      reviewStatus: "APPROVED",
      isManualEntry: true,
      extraNotes: "Example persona: freelancer billing via a staffing agency.",
    },
    benefits: [
      { benefitKey: "laptop" },
      { benefitKey: "ipCopyrightRemuneration", valueNumeric: 18000, currency: "EUR" },
    ],
  },

  // 3) Blue-collar — production operator, hourly + shift work
  {
    entry: {
      source: SOURCE,
      entryVersion: 2,
      workerType: "blueCollar",
      contractType: "permanent",
      country: "Belgium",
      workCity: "Genk",
      workProvince: "Limburg",
      locationGranularity: "city",
      commuteUnit: "km",
      commuteDistance: "12",
      commuteMethod: "Car",
      commuteCompensation: "Partial",
      age: 44,
      education: "vocational",
      degreeId: 22, // Graduaat programmeren (closest curated; demo)
      workExperience: 20,
      seniority: 11,
      civilStatus: "married",
      dependents: 3,
      sector: "Manufacturing",
      employeeCount: "1k-5k",
      multinational: true,
      jobTitle: "Production Operator (3-shift)",
      shiftDescription: "Rotating 3-shift (morning/late/night)",
      onCall: "Occasionally",
      currency: "EUR",
      hourlyRate: 22.5,
      netSalary: 2350,
      thirteenthMonth: "Full",
      mealVouchers: 8,
      ecoCheques: 250,
      groupInsurance: "yes",
      hasCompanyCar: false,
      hasEquity: false,
      officialHours: 38,
      averageHours: 40,
      vacationDays: 20,
      teleworkDays: 0,
      dayOffEase: "hard",
      stressLevel: "moderate",
      reviewStatus: "APPROVED",
      isManualEntry: true,
      extraNotes: "Example persona: blue-collar shift worker paid hourly.",
    },
    benefits: [
      { benefitKey: "advDays", valueNumeric: 12 },
      { benefitKey: "publicTransportReimbursement" },
    ],
  },

  // 4) PhD researcher — bursary, fixed-term mandate
  {
    entry: {
      source: SOURCE,
      entryVersion: 2,
      workerType: "phdResearcher",
      contractType: "fixedTerm",
      contractDurationMonths: 48,
      country: "Belgium",
      workCity: "Leuven",
      workProvince: "Flemish Brabant",
      locationGranularity: "city",
      commuteUnit: "minutes",
      commuteDistance: "25",
      commuteMethod: "Bike",
      commuteCompensation: "None",
      age: 27,
      education: "master",
      degreeId: 31, // Master fysica
      workExperience: 2,
      seniority: 2,
      civilStatus: "single",
      dependents: 0,
      sector: "Research",
      employeeCount: "5k-10k",
      multinational: false,
      jobTitle: "PhD Researcher (Physics)",
      currency: "EUR",
      bursaryAmount: 2450,
      virtualGrossSalary: 3150,
      hasCompanyCar: false,
      hasEquity: false,
      officialHours: 38,
      averageHours: 50,
      vacationDays: 35,
      teleworkDays: 2,
      dayOffEase: "easy",
      stressLevel: "high",
      reviewStatus: "APPROVED",
      isManualEntry: true,
      extraNotes: "Example persona: doctoral grant holder (tax-exempt bursary).",
    },
    benefits: [
      { benefitKey: "ecoCheques", valueNumeric: 240, currency: "EUR" },
      { benefitKey: "hospitalizationInsurance" },
    ],
  },

  // 5) Fixed-term marketeer — bonus-heavy, small company car
  {
    entry: {
      source: SOURCE,
      entryVersion: 2,
      workerType: "whiteCollar",
      contractType: "fixedTerm",
      contractDurationMonths: 12,
      country: "Belgium",
      workCity: "Ghent",
      workProvince: "East Flanders",
      locationGranularity: "city",
      commuteUnit: "km",
      commuteDistance: "30",
      commuteMethod: "Car",
      commuteCompensation: "Full",
      age: 29,
      education: "master",
      degreeId: 41, // Master TEW
      workExperience: 5,
      seniority: 1,
      civilStatus: "single",
      dependents: 0,
      sector: "Media",
      employeeCount: "51-200",
      multinational: false,
      jobTitle: "Marketing Manager",
      currency: "EUR",
      salaryBasis: "gross",
      grossSalary: 3600,
      netSalary: 2250,
      fixedGrossSalary: 3000,
      variableGrossSalary: 600,
      thirteenthMonth: "Partial",
      mealVouchers: 8,
      groupInsurance: "no",
      hasCompanyCar: true,
      companyCarModel: "Volkswagen Polo",
      companyCarFuelType: "fuel",
      companyCarCardScope: "belgium",
      hasEquity: false,
      officialHours: 38,
      averageHours: 42,
      vacationDays: 20,
      teleworkDays: 2,
      dayOffEase: "moderate",
      stressLevel: "high",
      reviewStatus: "APPROVED",
      isManualEntry: true,
      extraNotes: "Example persona: fixed-term, bonus-dependent marketing role.",
    },
    benefits: [
      { benefitKey: "bonus", valueNumeric: 6000, valueText: "Quarterly targets", currency: "EUR" },
      { benefitKey: "mobilityBudget", valueNumeric: 7000, currency: "EUR" },
    ],
  },

  // 6) Netherlands software engineer — vakantiegeld, 30%-ruling, equity
  {
    entry: {
      source: SOURCE,
      entryVersion: 2,
      workerType: "whiteCollar",
      contractType: "permanent",
      country: "Netherlands",
      workCity: "Amsterdam",
      locationGranularity: "city",
      commuteUnit: "minutes",
      commuteDistance: "40",
      commuteMethod: "Train",
      commuteCompensation: "Full",
      age: 33,
      education: "master",
      degreeId: 20, // Master computerwetenschappen (universal)
      workExperience: 9,
      seniority: 4,
      civilStatus: "cohabiting",
      dependents: 1,
      sector: "Technology/SaaS",
      employeeCount: "5k-10k",
      multinational: true,
      jobTitle: "Staff Software Engineer",
      currency: "EUR",
      salaryBasis: "gross",
      grossSalary: 6200,
      netSalary: 4100,
      hasCompanyCar: false,
      hasEquity: true,
      officialHours: 40,
      averageHours: 42,
      vacationDays: 27,
      teleworkDays: 3,
      dayOffEase: "easy",
      stressLevel: "moderate",
      reviewStatus: "APPROVED",
      isManualEntry: true,
      extraNotes: "Example persona: Netherlands tech role (30%-ruling + RSUs).",
    },
    benefits: [
      { benefitKey: "vakantiegeld8pct" },
      { benefitKey: "thirtyPercentRuling" },
      { benefitKey: "pensioenregeling" },
      { benefitKey: "reiskostenvergoeding", valueNumeric: 160, currency: "EUR" },
      { benefitKey: "eindejaarsuitkering", valueText: "full" },
      { benefitKey: "equity", valueNumeric: 32000, valueText: "RSU, 4-year vest", currency: "EUR" },
    ],
  },

  // 7) Cross-border worker — lives in NL, works in BE (grenswerker)
  {
    entry: {
      source: SOURCE,
      entryVersion: 2,
      workerType: "whiteCollar",
      contractType: "permanent",
      country: "Belgium",
      residenceCountry: "Netherlands",
      workCity: "Antwerp",
      workProvince: "Antwerp",
      locationGranularity: "province",
      commuteUnit: "minutes",
      commuteDistance: "70",
      commuteMethod: "Car",
      commuteCompensation: "Full",
      age: 41,
      education: "bachelor",
      degreeId: 21, // Bachelor toegepaste informatica
      workExperience: 18,
      seniority: 6,
      civilStatus: "married",
      dependents: 2,
      sector: "Logistics",
      employeeCount: "201-500",
      multinational: true,
      jobTitle: "IT Team Lead (cross-border)",
      currency: "EUR",
      salaryBasis: "both",
      grossSalary: 4600,
      netSalary: 2900,
      thirteenthMonth: "Full",
      mealVouchers: 8,
      groupInsurance: "yes",
      hasCompanyCar: true,
      companyCarModel: "Skoda Octavia",
      companyCarFuelType: "hybrid",
      companyCarCardScope: "benelux",
      hasEquity: false,
      officialHours: 40,
      averageHours: 44,
      vacationDays: 26,
      teleworkDays: 2,
      dayOffEase: "moderate",
      stressLevel: "moderate",
      reviewStatus: "APPROVED",
      isManualEntry: true,
      extraNotes: "Example persona: grenswerker living in NL, working in BE.",
    },
    benefits: [{ benefitKey: "hospitalizationInsurance" }, { benefitKey: "bikeLease" }],
  },
];

async function seedExamples() {
  // Wipe previous example rows (dev only) for idempotency.
  const existing = await db
    .select({ id: salaryEntries.id })
    .from(salaryEntries)
    .where(eq(salaryEntries.source, SOURCE));
  const ids = existing.map((e) => e.id);
  if (ids.length > 0) {
    await db.delete(entryBenefits).where(inArray(entryBenefits.salaryEntryId, ids));
    await db.delete(salaryEntries).where(inArray(salaryEntries.id, ids));
    console.log(`Removed ${ids.length} previous example rows.`);
  }

  for (const ex of examples) {
    const inserted = await db.insert(salaryEntries).values(ex.entry).returning();
    const row = inserted[0];
    await persistEntryBenefits(row.id, ex.benefits, row);
    console.log(`+ #${row.id}  ${row.workerType?.padEnd(13)}  ${row.jobTitle}`);
  }
  console.log(`\n✅ Seeded ${examples.length} example entries (source="${SOURCE}").`);
}

seedExamples()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Failed to seed examples:", err);
    process.exit(1);
  });
