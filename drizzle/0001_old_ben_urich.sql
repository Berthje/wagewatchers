CREATE TABLE "City" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "country" text NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "country_idx" ON "City" USING btree ("country");--> statement-breakpoint
CREATE INDEX "name_country_idx" ON "City" USING btree ("name","country");