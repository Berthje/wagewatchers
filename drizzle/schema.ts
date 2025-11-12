import { pgTable, index, serial, timestamp, text, integer, boolean, real, unique } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const salaryEntry = pgTable("SalaryEntry", {
	id: serial().primaryKey().notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	country: text(),
	subreddit: text(),
	age: integer(),
	education: text(),
	workExperience: integer(),
	civilStatus: text(),
	dependents: integer(),
	sector: text(),
	employeeCount: text(),
	multinational: boolean(),
	jobTitle: text(),
	jobDescription: text(),
	seniority: integer(),
	officialHours: integer(),
	averageHours: integer(),
	shiftDescription: text(),
	onCall: text(),
	vacationDays: integer(),
	currency: text().default('EUR'),
	grossSalary: real(),
	netSalary: real(),
	netCompensation: real(),
	thirteenthMonth: text(),
	mealVouchers: real(),
	ecoCheques: real(),
	groupInsurance: text(),
	otherInsurances: text(),
	otherBenefits: text(),
	workCity: text(),
	commuteDistance: text(),
	commuteMethod: text(),
	commuteCompensation: text(),
	teleworkDays: integer(),
	dayOffEase: text(),
	stressLevel: text(),
	reports: integer(),
	source: text(),
	sourceUrl: text(),
	extraNotes: text(),
	isManualEntry: boolean().default(true).notNull(),
	lastCommentsFetch: timestamp({ withTimezone: true, mode: 'string' }),
	ownerToken: text(),
	editableUntil: timestamp({ withTimezone: true, mode: 'string' }),
	reviewStatus: text().default('APPROVED').notNull(),
	anomalyScore: real(),
	anomalyReason: text(),
	reviewedBy: integer(),
	reviewedAt: timestamp({ withTimezone: true, mode: 'string' }),
	reportCount: integer().default(0).notNull(),
}, (table) => [
	index("ownerToken_idx").using("btree", table.ownerToken.asc().nullsLast().op("text_ops")),
	index("reviewStatus_idx").using("btree", table.reviewStatus.asc().nullsLast().op("text_ops")),
	index("salaryEntry_country_idx").using("btree", table.country.asc().nullsLast().op("text_ops")),
	index("salaryEntry_country_workCity_idx").using("btree", table.country.asc().nullsLast().op("text_ops"), table.workCity.asc().nullsLast().op("text_ops")),
	index("salaryEntry_grossSalary_idx").using("btree", table.grossSalary.asc().nullsLast().op("float4_ops")),
	index("salaryEntry_reviewStatus_country_idx").using("btree", table.reviewStatus.asc().nullsLast().op("text_ops"), table.country.asc().nullsLast().op("text_ops")),
	index("salaryEntry_sector_idx").using("btree", table.sector.asc().nullsLast().op("text_ops")),
	index("salaryEntry_workCity_idx").using("btree", table.workCity.asc().nullsLast().op("text_ops")),
]);

export const report = pgTable("Report", {
	id: serial().primaryKey().notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	type: text().notNull(),
	status: text().default('TODO').notNull(),
	priority: text().default('MEDIUM').notNull(),
	trackingId: text().notNull(),
	email: text(),
}, (table) => [
	unique("Report_trackingId_unique").on(table.trackingId),
]);

export const entryReport = pgTable("EntryReport", {
	id: serial().primaryKey().notNull(),
	salaryEntryId: integer().notNull(),
	ipAddress: text().notNull(),
	userAgent: text(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("entryReport_salaryEntryId_idx").using("btree", table.salaryEntryId.asc().nullsLast().op("int4_ops")),
	index("entryReport_ipAddress_salaryEntryId_idx").using("btree", table.ipAddress.asc().nullsLast().op("text_ops"), table.salaryEntryId.asc().nullsLast().op("int4_ops")),
]);

export const exchangeRate = pgTable("ExchangeRate", {
	id: serial().primaryKey().notNull(),
	currency: text().notNull(),
	rate: real().notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("currency_idx").using("btree", table.currency.asc().nullsLast().op("text_ops")),
	unique("ExchangeRate_currency_unique").on(table.currency),
]);

export const comment = pgTable("Comment", {
	id: serial().primaryKey().notNull(),
	externalId: text(),
	body: text().notNull(),
	author: text(),
	score: integer().default(0),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	depth: integer().default(0).notNull(),
	parentId: integer(),
	salaryEntryId: integer().notNull(),
}, (table) => [
	index("parentId_idx").using("btree", table.parentId.asc().nullsLast().op("int4_ops")),
	index("salaryEntryId_idx").using("btree", table.salaryEntryId.asc().nullsLast().op("int4_ops")),
]);

export const admin = pgTable("Admin", {
	id: serial().primaryKey().notNull(),
	email: text().notNull(),
	password: text().notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("Admin_email_unique").on(table.email),
]);

export const city = pgTable("City", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	country: text().notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	countryCode: text(),
	admin1Code: text(),
	admin2Code: text(),
	admin3Code: text(),
	admin4Code: text(),
	latitude: real(),
	longitude: real(),
	alternateNames: text(),
}, (table) => [
	index("admin1Code_idx").using("btree", table.admin1Code.asc().nullsLast().op("text_ops")),
	index("admin2Code_idx").using("btree", table.admin2Code.asc().nullsLast().op("text_ops")),
	index("countryCode_admin1_idx").using("btree", table.countryCode.asc().nullsLast().op("text_ops"), table.admin1Code.asc().nullsLast().op("text_ops")),
	index("country_idx").using("btree", table.country.asc().nullsLast().op("text_ops")),
	index("name_country_idx").using("btree", table.name.asc().nullsLast().op("text_ops"), table.country.asc().nullsLast().op("text_ops")),
]);

export const newsletterSubscriber = pgTable("NewsletterSubscriber", {
	id: serial().primaryKey().notNull(),
	email: text().notNull(),
	subscribedAt: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	isActive: boolean().default(true).notNull(),
}, (table) => [
	index("email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	unique("NewsletterSubscriber_email_unique").on(table.email),
]);
