import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  real,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const reportType = ["BUG", "FEATURE", "IMPROVEMENT"] as const;
export const reportStatus = ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"] as const;
export const priority = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const reviewStatus = ["APPROVED", "PENDING", "REJECTED", "NEEDS_REVIEW"] as const;

// v2 entry enums (additive — old rows are implicitly v1 and leave these null)
export const workerType = [
  "whiteCollar",
  "blueCollar",
  "freelancer",
  "intern",
  "phdResearcher",
] as const;
export const salaryBasis = ["gross", "net", "both"] as const;
export const contractType = [
  "permanent",
  "fixedTerm",
  "interim",
  "internship",
  "freelance",
] as const;
export const carFuelType = ["electric", "hybrid", "fuel"] as const;
export const carCardScope = ["belgium", "benelux", "europe"] as const;
export const locationGranularity = ["country", "province", "city"] as const;
export const commuteUnit = ["km", "minutes"] as const;

// Benefits catalog (Layer C) — adding a benefit is a catalog row, never a migration.
export const benefitCategory = [
  "cash", // bonus, 13th month, allowances, vouchers
  "equity", // stocks/RSUs/warrants/options
  "insurance", // hospitalization/dental/ambulatory/group/guaranteed-income
  "mobility", // car/bike/fuel/mobility budget/public transport
  "timeOff", // extra leave / ADV / RTT
  "retirement", // pension / group insurance savings
  "other",
] as const;
export const benefitValueType = ["boolean", "amount", "percent", "enum", "text"] as const;

// Canonical degree taxonomy (curated, filterable). degreeLevel mirrors the
// academic level; the Degree lookup table holds the curated list per country.
export const degreeLevel = ["bachelor", "master", "phd", "professional", "associate"] as const;

// Tables
export const salaryEntries = pgTable(
  "SalaryEntry",
  {
    id: serial("id").primaryKey(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    country: text("country"),
    subreddit: text("subreddit"),
    age: integer("age"),
    education: text("education"),
    workExperience: integer("workExperience"),
    civilStatus: text("civilStatus"),
    dependents: integer("dependents"),
    sector: text("sector"),
    employeeCount: text("employeeCount"),
    multinational: boolean("multinational"),
    jobTitle: text("jobTitle"),
    jobDescription: text("jobDescription"),
    seniority: integer("seniority"),
    officialHours: real("officialHours"),
    averageHours: real("averageHours"),
    shiftDescription: text("shiftDescription"),
    onCall: text("onCall"),
    vacationDays: real("vacationDays"),
    currency: text("currency").default("EUR"),
    grossSalary: real("grossSalary"),
    netSalary: real("netSalary"),
    netCompensation: real("netCompensation"),
    thirteenthMonth: text("thirteenthMonth"),
    mealVouchers: real("mealVouchers"),
    ecoCheques: real("ecoCheques"),
    groupInsurance: text("groupInsurance"),
    otherInsurances: text("otherInsurances"),
    otherBenefits: text("otherBenefits"),
    workCity: text("workCity"),
    commuteDistance: text("commuteDistance"),
    commuteMethod: text("commuteMethod"),
    commuteCompensation: text("commuteCompensation"),
    teleworkDays: real("teleworkDays"),
    dayOffEase: text("dayOffEase"),
    stressLevel: text("stressLevel"),
    reports: integer("reports"),
    source: text("source"),
    sourceUrl: text("sourceUrl"),
    extraNotes: text("extraNotes"),
    isManualEntry: boolean("isManualEntry").default(true).notNull(),
    lastCommentsFetch: timestamp("lastCommentsFetch", { withTimezone: true }),
    ownerToken: text("ownerToken"),
    editableUntil: timestamp("editableUntil", { withTimezone: true }),
    // Anomaly detection fields
    reviewStatus: text("reviewStatus", { enum: reviewStatus }).default("APPROVED").notNull(),
    anomalyScore: real("anomalyScore"),
    anomalyReason: text("anomalyReason"),
    reviewedBy: integer("reviewedBy"),
    reviewedAt: timestamp("reviewedAt", { withTimezone: true }),
    reportCount: integer("reportCount").default(0).notNull(),

    // ── v2 structured fields (additive & nullable; old ~1,900 rows keep nulls) ──
    // Layer A: discriminator. New rows set this to 2 in the API insert; old rows
    // stay null (v1). NO DB default — a default would backfill the ~1,900 legacy
    // rows with 2 and misidentify them as v2.
    entryVersion: integer("entryVersion"),
    workerType: text("workerType", { enum: workerType }),

    // Layer B: structured core (worker-type dependent; heavily filtered/charted)
    salaryBasis: text("salaryBasis", { enum: salaryBasis }),
    fixedGrossSalary: real("fixedGrossSalary"), // monthly fixed part
    variableGrossSalary: real("variableGrossSalary"), // monthly variable/bonus part
    hourlyRate: real("hourlyRate"), // blue-collar
    dayRate: real("dayRate"), // freelancer
    agencyCutPercent: real("agencyCutPercent"), // freelancer middleman %
    clientDayBudget: real("clientDayBudget"), // freelancer total client budget/day
    bursaryAmount: real("bursaryAmount"), // PhD actual paid bursary
    virtualGrossSalary: real("virtualGrossSalary"), // PhD institute virtual gross
    contractType: text("contractType", { enum: contractType }),
    contractDurationMonths: integer("contractDurationMonths"),

    // Denormalized filter flags — answer the two most-requested filters with a
    // trivial indexed WHERE; the details live in the benefits catalog (Layer C).
    hasCompanyCar: boolean("hasCompanyCar"),
    companyCarModel: text("companyCarModel"), // e.g. "BMW 320e", "VW Golf"
    companyCarFuelType: text("companyCarFuelType", { enum: carFuelType }), // electric | hybrid | fuel
    companyCarCardScope: text("companyCarCardScope", { enum: carCardScope }), // fuel/charge card range
    hasEquity: boolean("hasEquity"), // stocks/RSUs/warrants — cross-country, not US-only

    // Location granularity + cross-border
    locationGranularity: text("locationGranularity", { enum: locationGranularity }),
    workProvince: text("workProvince"), // City.admin1Code/name
    residenceCountry: text("residenceCountry"), // grenswerkers (live ≠ work)
    commuteUnit: text("commuteUnit", { enum: commuteUnit }), // pairs with existing commuteDistance

    // Education: canonical degree (Degree lookup lands in a later phase); keep `education` too.
    degreeId: integer("degreeId"),

    // Added from the NLSalaris template (also useful BE-wide), all nullable:
    publiclyListed: boolean("publiclyListed"), // Beursgenoteerd bedrijf? (stock-listed employer)
    jobSatisfaction: integer("jobSatisfaction"), // 0–10 "how much do you enjoy your job"
    commuteTimeMinutes: integer("commuteTimeMinutes"), // reistijd — pairs with commuteDistance (km)
  },
  (table) => [
    index("ownerToken_idx").on(table.ownerToken),
    index("reviewStatus_idx").on(table.reviewStatus),
    index("workerType_idx").on(table.workerType),
    index("hasCompanyCar_idx").on(table.hasCompanyCar),
    index("hasEquity_idx").on(table.hasEquity),
    index("degreeId_idx").on(table.degreeId),
  ]
);

export const comments = pgTable(
  "Comment",
  {
    id: serial("id").primaryKey(),
    externalId: text("externalId"),
    body: text("body").notNull(),
    author: text("author"),
    score: integer("score").default(0),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    depth: integer("depth").default(0).notNull(),
    parentId: integer("parentId"),
    salaryEntryId: integer("salaryEntryId").notNull(),
  },
  (table) => [
    index("salaryEntryId_idx").on(table.salaryEntryId),
    index("parentId_idx").on(table.parentId),
  ]
);

export const reports = pgTable("Report", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type", { enum: reportType }).notNull(),
  status: text("status", { enum: reportStatus }).default("TODO").notNull(),
  priority: text("priority", { enum: priority }).default("MEDIUM").notNull(),
  trackingId: text("trackingId").unique().notNull(),
  email: text("email"),
});

export const entryReports = pgTable(
  "EntryReport",
  {
    id: serial("id").primaryKey(),
    salaryEntryId: integer("salaryEntryId").notNull(),
    ipAddress: text("ipAddress").notNull(),
    userAgent: text("userAgent"),
    reason: text("reason"),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("entryReport_salaryEntryId_idx").on(table.salaryEntryId),
    index("entryReport_ipAddress_salaryEntryId_idx").on(table.ipAddress, table.salaryEntryId),
  ]
);

// Catalog of every benefit we know about, scoped by country availability.
// New per-country benefits are added as rows here — never as schema migrations.
export const benefitDefinitions = pgTable(
  "BenefitDefinition",
  {
    id: serial("id").primaryKey(),
    key: text("key").unique().notNull(), // "mealVouchers", "equity", "bonus", "vakantiegeld8pct", ...
    category: text("category", { enum: benefitCategory }).notNull(),
    valueType: text("valueType", { enum: benefitValueType }).notNull(),
    countries: text("countries").array(), // ["BE","NL",...] ; null = universal
    workerTypes: text("workerTypes").array(), // applicable worker types; null = all
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("benefitDefinition_key_idx").on(table.key)]
);

// One row per benefit a person actually has on an entry. valueText carries
// sub-attributes (e.g. equity vesting schedule, bonus frequency/type).
export const entryBenefits = pgTable(
  "EntryBenefit",
  {
    id: serial("id").primaryKey(),
    salaryEntryId: integer("salaryEntryId")
      .notNull()
      .references(() => salaryEntries.id),
    benefitKey: text("benefitKey").notNull(), // matches BenefitDefinition.key
    valueNumeric: real("valueNumeric"),
    valueText: text("valueText"),
    currency: text("currency"),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("entryBenefit_entry_idx").on(table.salaryEntryId),
    index("entryBenefit_key_idx").on(table.benefitKey),
  ]
);

// Curated, filterable degree list (mirrors the City lookup pattern). Seeded from
// the typed catalog in src/lib/degrees-catalog.ts. SalaryEntry.degreeId loosely
// references Degree.id (no FK constraint — same loose-reference style as workCity).
export const degrees = pgTable(
  "Degree",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(), // e.g. "Burgerlijk ingenieur — elektrotechniek"
    field: text("field").notNull(), // e.g. "engineering", "computerScience"
    level: text("level", { enum: degreeLevel }).notNull(),
    countries: text("countries").array(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("degree_field_idx").on(table.field)]
);

export const admins = pgTable("Admin", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export const exchangeRates = pgTable(
  "ExchangeRate",
  {
    id: serial("id").primaryKey(),
    currency: text("currency").unique().notNull(),
    rate: real("rate").notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("currency_idx").on(table.currency)]
);

export const cities = pgTable(
  "City",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    country: text("country").notNull(),
    countryCode: text("countryCode"),
    admin1Code: text("admin1Code"),
    admin2Code: text("admin2Code"),
    admin3Code: text("admin3Code"),
    admin4Code: text("admin4Code"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    alternateNames: text("alternateNames"),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("country_idx").on(table.country),
    index("name_country_idx").on(table.name, table.country),
    index("admin1Code_idx").on(table.admin1Code),
    index("admin2Code_idx").on(table.admin2Code),
  ]
);

export const newsletterSubscribers = pgTable(
  "NewsletterSubscriber",
  {
    id: serial("id").primaryKey(),
    email: text("email").unique().notNull(),
    subscribedAt: timestamp("subscribedAt", { withTimezone: true }).defaultNow().notNull(),
    isActive: boolean("isActive").default(true).notNull(),
  },
  (table) => [index("email_idx").on(table.email)]
);

// Relations
export const salaryEntriesRelations = relations(salaryEntries, ({ many }) => ({
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  salaryEntry: one(salaryEntries, {
    fields: [comments.salaryEntryId],
    references: [salaryEntries.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: "commentHierarchy",
  }),
}));

// Type exports for compatibility
export type SalaryEntry = typeof salaryEntries.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type EntryReport = typeof entryReports.$inferSelect;
export type Admin = typeof admins.$inferSelect;
export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type City = typeof cities.$inferSelect;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
