import { pgTable, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const appPasswordSessions = pgTable('app_password_sessions', {
  did: text('did').primaryKey(),
  sessionData: jsonb('session_data').notNull(),
  appPassword: text('app_password').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
