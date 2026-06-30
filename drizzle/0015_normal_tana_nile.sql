CREATE TABLE "Degree" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"field" text NOT NULL,
	"level" text NOT NULL,
	"countries" text[],
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "degree_field_idx" ON "Degree" USING btree ("field");