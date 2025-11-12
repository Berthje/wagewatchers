CREATE TABLE "EntryReport" (
	"id" serial PRIMARY KEY NOT NULL,
	"salaryEntryId" integer NOT NULL,
	"ipAddress" text NOT NULL,
	"userAgent" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "SalaryEntry" ADD COLUMN "reportCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "entryReport_salaryEntryId_idx" ON "EntryReport" USING btree ("salaryEntryId");--> statement-breakpoint
CREATE INDEX "entryReport_ipAddress_salaryEntryId_idx" ON "EntryReport" USING btree ("ipAddress","salaryEntryId");