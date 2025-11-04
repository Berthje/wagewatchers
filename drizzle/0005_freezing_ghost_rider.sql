ALTER TABLE "SalaryEntry" ADD COLUMN "reviewStatus" text DEFAULT 'APPROVED' NOT NULL;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "anomalyScore" real;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "anomalyReason" text;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "reviewedBy" integer;--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "reviewedAt" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "reviewStatus_idx" ON "SalaryEntry" USING btree ("reviewStatus");