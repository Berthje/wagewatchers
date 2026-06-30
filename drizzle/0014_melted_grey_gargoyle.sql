CREATE TABLE "BenefitDefinition" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"category" text NOT NULL,
	"valueType" text NOT NULL,
	"countries" text[],
	"workerTypes" text[],
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "BenefitDefinition_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "EntryBenefit" (
	"id" serial PRIMARY KEY NOT NULL,
	"salaryEntryId" integer NOT NULL,
	"benefitKey" text NOT NULL,
	"valueNumeric" real,
	"valueText" text,
	"currency" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "entryVersion" integer;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "workerType" text;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "salaryBasis" text;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "fixedGrossSalary" real;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "variableGrossSalary" real;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "hourlyRate" real;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "dayRate" real;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "agencyCutPercent" real;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "clientDayBudget" real;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "bursaryAmount" real;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "virtualGrossSalary" real;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "contractType" text;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "contractDurationMonths" integer;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "hasCompanyCar" boolean;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "companyCarModel" text;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "companyCarFuelType" text;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "companyCarCardScope" text;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "hasEquity" boolean;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "locationGranularity" text;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "workProvince" text;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "residenceCountry" text;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "commuteUnit" text;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "degreeId" integer;--> statement-breakpoint
ALTER TABLE "EntryBenefit" ADD CONSTRAINT "EntryBenefit_salaryEntryId_SalaryEntry_id_fk" FOREIGN KEY ("salaryEntryId") REFERENCES "public"."SalaryEntry"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "benefitDefinition_key_idx" ON "BenefitDefinition" USING btree ("key");--> statement-breakpoint
CREATE INDEX "entryBenefit_entry_idx" ON "EntryBenefit" USING btree ("salaryEntryId");--> statement-breakpoint
CREATE INDEX "entryBenefit_key_idx" ON "EntryBenefit" USING btree ("benefitKey");--> statement-breakpoint
CREATE INDEX "workerType_idx" ON "SalaryEntry" USING btree ("workerType");--> statement-breakpoint
CREATE INDEX "hasCompanyCar_idx" ON "SalaryEntry" USING btree ("hasCompanyCar");--> statement-breakpoint
CREATE INDEX "hasEquity_idx" ON "SalaryEntry" USING btree ("hasEquity");--> statement-breakpoint
CREATE INDEX "degreeId_idx" ON "SalaryEntry" USING btree ("degreeId");