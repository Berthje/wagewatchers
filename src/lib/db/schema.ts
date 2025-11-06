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
    officialHours: integer("officialHours"),
    averageHours: integer("averageHours"),
    shiftDescription: text("shiftDescription"),
    onCall: text("onCall"),
    vacationDays: integer("vacationDays"),
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
    teleworkDays: integer("teleworkDays"),
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
  },
  (table) => [
    index("ownerToken_idx").on(table.ownerToken),
    index("reviewStatus_idx").on(table.reviewStatus),
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
export type Admin = typeof admins.$inferSelect;
export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type City = typeof cities.$inferSelect;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
