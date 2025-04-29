import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const annotationFields = pgTable("annotation_fields", {
  id: text("id").primaryKey(),
  curatorId: text("curator_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  definitionType: text("definition_type").notNull(),
  definitionData: jsonb("definition_data").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  publishedRecordId: text("published_record_id"),
});
