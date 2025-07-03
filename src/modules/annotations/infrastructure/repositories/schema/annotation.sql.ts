import { pgTable, text, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { annotationFields } from "./annotationField.sql";
import { annotationTemplates } from "./annotationTemplate.sql";
import { publishedRecords } from "../../../../cards/infrastructure/repositories/schema/publishedRecord.sql";

export const annotations = pgTable("annotations", {
  id: uuid("id").primaryKey(),
  curatorId: text("curator_id").notNull(),
  url: text("url").notNull(),
  annotationFieldId: uuid("annotation_field_id")
    .notNull()
    .references(() => annotationFields.id),
  valueType: text("value_type").notNull(),
  valueData: jsonb("value_data").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  publishedRecordId: uuid("published_record_id").references(
    () => publishedRecords.id
  ),
});

// Join table for annotations to templates (many-to-many)
export const annotationToTemplates = pgTable("annotation_to_templates", {
  id: uuid("id").primaryKey(),
  annotationId: uuid("annotation_id")
    .notNull()
    .references(() => annotations.id, { onDelete: "cascade" }),
  templateId: uuid("template_id")
    .notNull()
    .references(() => annotationTemplates.id, { onDelete: "cascade" }),
});
