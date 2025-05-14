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
DROP TABLE "annotation_fields" CASCADE;--> statement-breakpoint
DROP TABLE "annotation_to_templates" CASCADE;--> statement-breakpoint
DROP TABLE "annotations" CASCADE;--> statement-breakpoint
DROP TABLE "annotation_template_fields" CASCADE;--> statement-breakpoint
DROP TABLE "annotation_templates" CASCADE;--> statement-breakpoint
DROP TABLE "published_records" CASCADE;--> statement-breakpoint
ALTER TABLE "auth_refresh_tokens" ADD CONSTRAINT "auth_refresh_tokens_user_did_users_id_fk" FOREIGN KEY ("user_did") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;