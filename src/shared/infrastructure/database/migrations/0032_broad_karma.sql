ALTER TABLE "cards" ADD COLUMN "visibility" text DEFAULT 'PUBLIC' NOT NULL;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "visibility" text DEFAULT 'PUBLIC' NOT NULL;