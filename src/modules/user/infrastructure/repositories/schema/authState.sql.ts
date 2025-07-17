import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const authState = pgTable('auth_state', {
  key: text('key').primaryKey(),
  state: text('state').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
