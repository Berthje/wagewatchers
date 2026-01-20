ALTER TABLE "SalaryEntry" ADD COLUMN "bonusAmount" real;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "bonusType" text;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "bonusPercent" real;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "bonusFrequency" text;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "bonusPaymentCountPerYear" integer;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "bonusCertainty" text;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "rsuEstimatedAnnualValue" real;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "rsuVestingMonths" integer;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "compensationNotes" text;