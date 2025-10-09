ALTER TABLE "cards" RENAME COLUMN "original_published_record_id" TO "published_record_id";--> statement-breakpoint
ALTER TABLE "cards" DROP CONSTRAINT "cards_original_published_record_id_published_records_id_fk";
--> statement-breakpoint
TRUNCATE TABLE "cards" CASCADE;--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "author_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_published_record_id_published_records_id_fk" FOREIGN KEY ("published_record_id") REFERENCES "public"."published_records"("id") ON DELETE no action ON UPDATE no action;
