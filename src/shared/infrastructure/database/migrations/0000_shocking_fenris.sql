CREATE TABLE "cards" (
	"id" uuid PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"content_data" jsonb NOT NULL,
	"url" text,
	"parent_card_id" uuid,
	"original_published_record_id" uuid,
	"library_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collection_cards" (
	"id" uuid PRIMARY KEY NOT NULL,
	"collection_id" uuid NOT NULL,
	"card_id" uuid NOT NULL,
	"added_by" text NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	"published_record_id" uuid
);
--> statement-breakpoint
CREATE TABLE "collection_collaborators" (
	"id" uuid PRIMARY KEY NOT NULL,
	"collection_id" uuid NOT NULL,
	"collaborator_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY NOT NULL,
	"author_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"access_type" text NOT NULL,
	"card_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"published_record_id" uuid
);
--> statement-breakpoint
CREATE TABLE "library_memberships" (
	"card_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	"published_record_id" uuid,
	CONSTRAINT "library_memberships_card_id_user_id_pk" PRIMARY KEY("card_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "published_records" (
	"id" uuid PRIMARY KEY NOT NULL,
	"uri" text NOT NULL,
	"cid" text NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_session" (
	"key" text PRIMARY KEY NOT NULL,
	"session" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_state" (
	"key" text PRIMARY KEY NOT NULL,
	"state" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "auth_refresh_tokens" (
	"token_id" text PRIMARY KEY NOT NULL,
	"user_did" text NOT NULL,
	"refresh_token" text NOT NULL,
	"issued_at" timestamp NOT NULL,
	"expires_at" timestamp NOT NULL,
	"revoked" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"handle" text,
	"linked_at" timestamp NOT NULL,
	"last_login_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_parent_card_id_cards_id_fk" FOREIGN KEY ("parent_card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_original_published_record_id_published_records_id_fk" FOREIGN KEY ("original_published_record_id") REFERENCES "public"."published_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_cards" ADD CONSTRAINT "collection_cards_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_cards" ADD CONSTRAINT "collection_cards_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_cards" ADD CONSTRAINT "collection_cards_published_record_id_published_records_id_fk" FOREIGN KEY ("published_record_id") REFERENCES "public"."published_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_collaborators" ADD CONSTRAINT "collection_collaborators_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_published_record_id_published_records_id_fk" FOREIGN KEY ("published_record_id") REFERENCES "public"."published_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_memberships" ADD CONSTRAINT "library_memberships_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_memberships" ADD CONSTRAINT "library_memberships_published_record_id_published_records_id_fk" FOREIGN KEY ("published_record_id") REFERENCES "public"."published_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_refresh_tokens" ADD CONSTRAINT "auth_refresh_tokens_user_did_users_id_fk" FOREIGN KEY ("user_did") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_user_cards" ON "library_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_card_users" ON "library_memberships" USING btree ("card_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uri_cid_unique_idx" ON "published_records" USING btree ("uri","cid");