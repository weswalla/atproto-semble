import { pgTable, text, uuid, uniqueIndex } from "drizzle-orm/pg-core";

// Define the published records table schema
export const publishedRecords = pgTable("published_records", {
  id: uuid("id").primaryKey(),
  uri: text("uri").notNull().unique(), // Add unique constraint
  cid: text("cid").notNull(),
});
