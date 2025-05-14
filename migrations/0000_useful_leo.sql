CREATE TABLE "annotation_fields" (
	"id" uuid PRIMARY KEY NOT NULL,
	"curator_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"definition_type" text NOT NULL,
	"definition_data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"published_record_id" uuid
);
--> statement-breakpoint
CREATE TABLE "annotation_to_templates" (
	"id" uuid PRIMARY KEY NOT NULL,
	"annotation_id" uuid NOT NULL,
	"template_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "annotations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"curator_id" text NOT NULL,
	"url" text NOT NULL,
	"annotation_field_id" uuid NOT NULL,
	"value_type" text NOT NULL,
	"value_data" jsonb NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"published_record_id" uuid
);
--> statement-breakpoint
CREATE TABLE "annotation_template_fields" (
	"id" uuid PRIMARY KEY NOT NULL,
	"template_id" uuid NOT NULL,
	"field_id" uuid NOT NULL,
	"required" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "annotation_templates" (
	"id" uuid PRIMARY KEY NOT NULL,
	"curator_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"published_record_id" uuid
);
--> statement-breakpoint
CREATE TABLE "published_records" (
	"id" uuid PRIMARY KEY NOT NULL,
	"uri" text NOT NULL,
	"cid" text NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "annotation_fields" ADD CONSTRAINT "annotation_fields_published_record_id_published_records_id_fk" FOREIGN KEY ("published_record_id") REFERENCES "public"."published_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "annotation_to_templates" ADD CONSTRAINT "annotation_to_templates_annotation_id_annotations_id_fk" FOREIGN KEY ("annotation_id") REFERENCES "public"."annotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "annotation_to_templates" ADD CONSTRAINT "annotation_to_templates_template_id_annotation_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."annotation_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_annotation_field_id_annotation_fields_id_fk" FOREIGN KEY ("annotation_field_id") REFERENCES "public"."annotation_fields"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_published_record_id_published_records_id_fk" FOREIGN KEY ("published_record_id") REFERENCES "public"."published_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "annotation_template_fields" ADD CONSTRAINT "annotation_template_fields_template_id_annotation_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."annotation_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "annotation_templates" ADD CONSTRAINT "annotation_templates_published_record_id_published_records_id_fk" FOREIGN KEY ("published_record_id") REFERENCES "public"."published_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uri_cid_unique_idx" ON "published_records" USING btree ("uri","cid");