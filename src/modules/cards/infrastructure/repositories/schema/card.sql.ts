import { pgTable, text, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { publishedRecords } from "../../../../annotations/infrastructure/repositories/schema/publishedRecord.sql";

export const cards = pgTable("cards", {
  id: uuid("id").primaryKey(),
  curatorId: text("curator_id").notNull(),
  type: text("type").notNull(), // URL, NOTE, HIGHLIGHT
  contentData: jsonb("content_data").notNull(),
  parentCardId: uuid("parent_card_id").references(() => cards.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  publishedRecordId: uuid("published_record_id").references(
    () => publishedRecords.id
  ),
});
