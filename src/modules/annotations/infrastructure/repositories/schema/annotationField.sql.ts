import { pgTable, text, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { publishedRecords } from "./publishedRecord.sql";

export const annotationFields = pgTable("annotation_fields", {
  id: uuid("id").primaryKey(),
  curatorId: text("curator_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  definitionType: text("definition_type").notNull(),
  definitionData: jsonb("definition_data").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  publishedRecordId: uuid("published_record_id").references(
    () => publishedRecords.id
  ),
});
