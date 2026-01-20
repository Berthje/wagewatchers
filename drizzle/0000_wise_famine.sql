CREATE TABLE "Admin" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Admin_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "Comment" (
	"id" serial PRIMARY KEY NOT NULL,
	"externalId" text,
	"body" text NOT NULL,
	"author" text,
	"score" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"depth" integer DEFAULT 0 NOT NULL,
	"parentId" integer,
	"salaryEntryId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ExchangeRate" (
	"id" serial PRIMARY KEY NOT NULL,
	"currency" text NOT NULL,
	"rate" real NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ExchangeRate_currency_unique" UNIQUE("currency")
);
--> statement-breakpoint
CREATE TABLE "Report" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'TODO' NOT NULL,
	"priority" text DEFAULT 'MEDIUM' NOT NULL,
	"trackingId" text NOT NULL,
	"email" text,
	CONSTRAINT "Report_trackingId_unique" UNIQUE("trackingId")
);
--> statement-breakpoint
CREATE TABLE "SalaryEntry" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"country" text,
	"subreddit" text,
	"age" integer,
	"education" text,
	"workExperience" integer,
	"civilStatus" text,
	"dependents" integer,
	"sector" text,
	"employeeCount" text,
	"multinational" boolean,
	"jobTitle" text,
	"jobDescription" text,
	"seniority" integer,
	"officialHours" integer,
	"averageHours" integer,
	"shiftDescription" text,
	"onCall" text,
	"vacationDays" integer,
	"currency" text DEFAULT 'EUR',
	"grossSalary" real,
	"netSalary" real,
	"netCompensation" real,
	"mobility" text,
	"thirteenthMonth" text,
	"mealVouchers" real,
	"ecoCheques" real,
	"groupInsurance" text,
	"otherInsurances" text,
	"otherBenefits" text,
	"workCity" text,
	"commuteDistance" text,
	"commuteMethod" text,
	"commuteCompensation" text,
	"teleworkDays" integer,
	"dayOffEase" text,
	"stressLevel" text,
	"reports" integer,
	"source" text,
	"sourceUrl" text,
	"extraNotes" text,
	"isManualEntry" boolean DEFAULT true NOT NULL,
	"lastCommentsFetch" timestamp,
	"ownerToken" text,
	"editableUntil" timestamp
);
--> statement-breakpoint
CREATE INDEX "salaryEntryId_idx" ON "Comment" USING btree ("salaryEntryId");--> statement-breakpoint
CREATE INDEX "parentId_idx" ON "Comment" USING btree ("parentId");--> statement-breakpoint
CREATE INDEX "currency_idx" ON "ExchangeRate" USING btree ("currency");--> statement-breakpoint
CREATE INDEX "ownerToken_idx" ON "SalaryEntry" USING btree ("ownerToken");
