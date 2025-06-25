import {
  pgTable,
  text,
  timestamp,
  jsonb,
  uuid,
  type PgTableWithColumns,
} from "drizzle-orm/pg-core";

export const cards: PgTableWithColumns<any> = pgTable("cards", {
  id: uuid("id").primaryKey(),
  type: text("type").notNull(), // URL, NOTE, HIGHLIGHT
  contentData: jsonb("content_data").notNull(),
  url: text("url"), // Optional URL field for all card types
  parentCardId: uuid("parent_card_id").references(() => cards.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
