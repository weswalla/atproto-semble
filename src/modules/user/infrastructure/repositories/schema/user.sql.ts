import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // DID
  handle: text("handle"),
  linkedAt: timestamp("linked_at").notNull(),
  lastLoginAt: timestamp("last_login_at").notNull()
});
