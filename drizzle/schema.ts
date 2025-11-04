import { pgTable, uniqueIndex, check, serial, timestamp, text, index, foreignKey, integer, boolean, doublePrecision, unique, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const priority = pgEnum("Priority", ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
export const reportStatus = pgEnum("ReportStatus", ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'])
export const reportType = pgEnum("ReportType", ['BUG', 'FEATURE', 'IMPROVEMENT'])


export const report = pgTable("Report", {
	id: serial().primaryKey().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	title: text().notNull(),
	description: text().notNull(),
	type: reportType().notNull(),
	status: reportStatus().default('TODO').notNull(),
	priority: priority().default('MEDIUM').notNull(),
	trackingId: text().notNull(),
	email: text(),
}, (table) => [
	uniqueIndex("Report_trackingId_key").using("btree", table.trackingId.asc().nullsLast().op("text_ops")),
	check("Report_id_not_null", sql`NOT NULL id`),
	check("Report_createdAt_not_null", sql`NOT NULL "createdAt"`),
	check("Report_updatedAt_not_null", sql`NOT NULL "updatedAt"`),
	check("Report_title_not_null", sql`NOT NULL title`),
	check("Report_description_not_null", sql`NOT NULL description`),
	check("Report_type_not_null", sql`NOT NULL type`),
	check("Report_status_not_null", sql`NOT NULL status`),
	check("Report_priority_not_null", sql`NOT NULL priority`),
	check("Report_trackingId_not_null", sql`NOT NULL "trackingId"`),
]);

export const comment = pgTable("Comment", {
	id: serial().primaryKey().notNull(),
	externalId: text(),
	body: text().notNull(),
	author: text(),
	score: integer().default(0),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	depth: integer().default(0).notNull(),
	parentId: integer(),
	salaryEntryId: integer().notNull(),
}, (table) => [
	index("Comment_parentId_idx").using("btree", table.parentId.asc().nullsLast().op("int4_ops")),
	index("Comment_salaryEntryId_idx").using("btree", table.salaryEntryId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "Comment_parentId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.salaryEntryId],
			foreignColumns: [salaryEntry.id],
			name: "Comment_salaryEntryId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	check("Comment_id_not_null", sql`NOT NULL id`),
	check("Comment_body_not_null", sql`NOT NULL body`),
	check("Comment_createdAt_not_null", sql`NOT NULL "createdAt"`),
	check("Comment_depth_not_null", sql`NOT NULL depth`),
	check("Comment_salaryEntryId_not_null", sql`NOT NULL "salaryEntryId"`),
]);

export const admin = pgTable("Admin", {
	id: serial().primaryKey().notNull(),
	email: text().notNull(),
	password: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("Admin_email_key").using("btree", table.email.asc().nullsLast().op("text_ops")),
	check("Admin_id_not_null", sql`NOT NULL id`),
	check("Admin_email_not_null", sql`NOT NULL email`),
	check("Admin_password_not_null", sql`NOT NULL password`),
	check("Admin_createdAt_not_null", sql`NOT NULL "createdAt"`),
	check("Admin_updatedAt_not_null", sql`NOT NULL "updatedAt"`),
]);

export const salaryEntry = pgTable("SalaryEntry", {
	id: serial().primaryKey().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
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
	grossSalary: doublePrecision(),
	netSalary: doublePrecision(),
	netCompensation: doublePrecision(),
	mobility: text(),
	thirteenthMonth: text(),
	mealVouchers: doublePrecision(),
	ecoCheques: doublePrecision(),
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
	lastCommentsFetch: timestamp({ precision: 3, mode: 'string' }),
	editableUntil: timestamp({ precision: 3, mode: 'string' }),
	ownerToken: text(),
	currency: text().default('EUR'),
	commuteDistanceUnit: text().default('km'),
}, (table) => [
	index("SalaryEntry_ownerToken_idx").using("btree", table.ownerToken.asc().nullsLast().op("text_ops")),
	check("SalaryEntry_id_not_null", sql`NOT NULL id`),
	check("SalaryEntry_createdAt_not_null", sql`NOT NULL "createdAt"`),
	check("SalaryEntry_isManualEntry_not_null", sql`NOT NULL "isManualEntry"`),
]);

export const exchangeRate = pgTable("ExchangeRate", {
	id: serial().primaryKey().notNull(),
	currency: text().notNull(),
	rate: doublePrecision().notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("ExchangeRate_currency_idx").using("btree", table.currency.asc().nullsLast().op("text_ops")),
	uniqueIndex("ExchangeRate_currency_key").using("btree", table.currency.asc().nullsLast().op("text_ops")),
	check("ExchangeRate_id_not_null", sql`NOT NULL id`),
	check("ExchangeRate_currency_not_null", sql`NOT NULL currency`),
	check("ExchangeRate_rate_not_null", sql`NOT NULL rate`),
	check("ExchangeRate_updatedAt_not_null", sql`NOT NULL "updatedAt"`),
	check("ExchangeRate_createdAt_not_null", sql`NOT NULL "createdAt"`),
]);

export const city = pgTable("City", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	country: text().notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	check("City_id_not_null", sql`NOT NULL id`),
	check("City_name_not_null", sql`NOT NULL name`),
	check("City_country_not_null", sql`NOT NULL country`),
	check("City_createdAt_not_null", sql`NOT NULL "createdAt"`),
	check("City_updatedAt_not_null", sql`NOT NULL "updatedAt"`),
]);

export const newsletterSubscriber = pgTable("NewsletterSubscriber", {
	id: serial().primaryKey().notNull(),
	email: text().notNull(),
	subscribedAt: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	isActive: boolean().default(true).notNull(),
}, (table) => [
	unique("NewsletterSubscriber_email_unique").on(table.email),
	check("NewsletterSubscriber_id_not_null", sql`NOT NULL id`),
	check("NewsletterSubscriber_email_not_null", sql`NOT NULL email`),
	check("NewsletterSubscriber_subscribedAt_not_null", sql`NOT NULL "subscribedAt"`),
	check("NewsletterSubscriber_isActive_not_null", sql`NOT NULL "isActive"`),
]);
