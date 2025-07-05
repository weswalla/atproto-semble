CREATE TABLE "app_password_sessions" (
	"did" text PRIMARY KEY NOT NULL,
	"session_data" jsonb NOT NULL,
	"app_password" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
