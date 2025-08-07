import { pgTable, text } from 'drizzle-orm/pg-core';

export const authSession = pgTable('auth_session', {
  key: text('key').primaryKey(), // DID
  session: text('session').notNull(), // JSON containing OAuth session data
});
