CREATE TABLE "NewsletterSubscriber" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"subscribedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	CONSTRAINT "NewsletterSubscriber_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "email_idx" ON "NewsletterSubscriber" USING btree ("email");