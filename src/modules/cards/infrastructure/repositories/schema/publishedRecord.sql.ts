import {
  pgTable,
  text,
  uuid,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// Define the published records table schema
export const publishedRecords = pgTable(
  'published_records',
  {
    id: uuid('id').primaryKey(),
    uri: text('uri').notNull(),
    cid: text('cid').notNull(),
    recordedAt: timestamp('recorded_at').notNull().defaultNow(),
  },
  (table) => {
    return {
      // Create a composite unique constraint to prevent exact duplicates
      uriCidUnique: uniqueIndex('uri_cid_unique_idx').on(table.uri, table.cid),
    };
  },
);
