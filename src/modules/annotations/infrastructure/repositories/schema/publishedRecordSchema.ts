import { pgTable, text, uuid } from "drizzle-orm/pg-core";

// Define the published records table schema
export const publishedRecords = pgTable("published_records", {
  id: uuid("id").primaryKey(),
  uri: text("uri").notNull(),
  cid: text("cid").notNull(),
});
