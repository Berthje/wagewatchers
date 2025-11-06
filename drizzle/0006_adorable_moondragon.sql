ALTER TABLE "City" ADD COLUMN "countryCode" text;--> statement-breakpoint
ALTER TABLE "City" ADD COLUMN "admin1Code" text;--> statement-breakpoint
ALTER TABLE "City" ADD COLUMN "admin2Code" text;--> statement-breakpoint
ALTER TABLE "City" ADD COLUMN "admin3Code" text;--> statement-breakpoint
ALTER TABLE "City" ADD COLUMN "admin4Code" text;--> statement-breakpoint
ALTER TABLE "City" ADD COLUMN "latitude" real;--> statement-breakpoint
ALTER TABLE "City" ADD COLUMN "longitude" real;--> statement-breakpoint
ALTER TABLE "City" ADD COLUMN "alternateNames" text;--> statement-breakpoint
CREATE INDEX "admin1Code_idx" ON "City" USING btree ("admin1Code");--> statement-breakpoint
CREATE INDEX "admin2Code_idx" ON "City" USING btree ("admin2Code");
