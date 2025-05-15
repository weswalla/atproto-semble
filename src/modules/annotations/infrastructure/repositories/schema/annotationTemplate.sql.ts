import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { publishedRecords } from "./publishedRecord.sql";

// Define the annotation template table schema
export const annotationTemplates = pgTable("annotation_templates", {
  id: uuid("id").primaryKey(),
  curatorId: text("curator_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  publishedRecordId: uuid("published_record_id").references(
    () => publishedRecords.id
  ),
});

// Define the annotation template fields join table schema
export const annotationTemplateFields = pgTable("annotation_template_fields", {
  id: uuid("id").primaryKey(),
  templateId: uuid("template_id")
    .notNull()
    .references(() => annotationTemplates.id, { onDelete: "cascade" }),
  fieldId: uuid("field_id").notNull(), // References annotation_fields table
  required: boolean("required").notNull().default(false),
});
