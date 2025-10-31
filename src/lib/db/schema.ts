import { pgTable, serial, text, integer, boolean, real, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const reportType = ['BUG', 'FEATURE', 'IMPROVEMENT'] as const;
export const reportStatus = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as const;
export const priority = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

// Tables
export const salaryEntries = pgTable('SalaryEntry', {
    id: serial('id').primaryKey(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    country: text('country'),
    subreddit: text('subreddit'),
    age: integer('age'),
    education: text('education'),
    workExperience: integer('workExperience'),
    civilStatus: text('civilStatus'),
    dependents: integer('dependents'),
    sector: text('sector'),
    employeeCount: text('employeeCount'),
    multinational: boolean('multinational'),
    jobTitle: text('jobTitle'),
    jobDescription: text('jobDescription'),
    seniority: integer('seniority'),
    officialHours: integer('officialHours'),
    averageHours: integer('averageHours'),
    shiftDescription: text('shiftDescription'),
    onCall: text('onCall'),
    vacationDays: integer('vacationDays'),
    currency: text('currency').default('EUR'),
    grossSalary: real('grossSalary'),
    netSalary: real('netSalary'),
    netCompensation: real('netCompensation'),
    mobility: text('mobility'),
    thirteenthMonth: text('thirteenthMonth'),
    mealVouchers: real('mealVouchers'),
    ecoCheques: real('ecoCheques'),
    groupInsurance: text('groupInsurance'),
    otherInsurances: text('otherInsurances'),
    otherBenefits: text('otherBenefits'),
    workCity: text('workCity'),
    commuteDistance: text('commuteDistance'),
    commuteMethod: text('commuteMethod'),
    commuteCompensation: text('commuteCompensation'),
    teleworkDays: integer('teleworkDays'),
    dayOffEase: text('dayOffEase'),
    stressLevel: text('stressLevel'),
    reports: integer('reports'),
    source: text('source'),
    sourceUrl: text('sourceUrl'),
    extraNotes: text('extraNotes'),
    isManualEntry: boolean('isManualEntry').default(true).notNull(),
    lastCommentsFetch: timestamp('lastCommentsFetch'),
    ownerToken: text('ownerToken'),
    editableUntil: timestamp('editableUntil'),
}, (table) => [
    index('ownerToken_idx').on(table.ownerToken),
]);

export const comments = pgTable('Comment', {
    id: serial('id').primaryKey(),
    externalId: text('externalId'),
    body: text('body').notNull(),
    author: text('author'),
    score: integer('score').default(0),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    depth: integer('depth').default(0).notNull(),
    parentId: integer('parentId'),
    salaryEntryId: integer('salaryEntryId').notNull(),
}, (table) => [
    index('salaryEntryId_idx').on(table.salaryEntryId),
    index('parentId_idx').on(table.parentId),
]);

export const reports = pgTable('Report', {
    id: serial('id').primaryKey(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    type: text('type', { enum: reportType }).notNull(),
    status: text('status', { enum: reportStatus }).default('TODO').notNull(),
    priority: text('priority', { enum: priority }).default('MEDIUM').notNull(),
    trackingId: text('trackingId').unique().notNull(),
    email: text('email'),
});

export const admins = pgTable('Admin', {
    id: serial('id').primaryKey(),
    email: text('email').unique().notNull(),
    password: text('password').notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

export const exchangeRates = pgTable('ExchangeRate', {
    id: serial('id').primaryKey(),
    currency: text('currency').unique().notNull(),
    rate: real('rate').notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (table) => [
    index('currency_idx').on(table.currency),
]);

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
        relationName: 'commentHierarchy',
    }),
}));

// Type exports for compatibility
export type SalaryEntry = typeof salaryEntries.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type Admin = typeof admins.$inferSelect;
export type ExchangeRate = typeof exchangeRates.$inferSelect;