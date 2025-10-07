import {
  pgTable,
  text,
  timestamp,
  jsonb,
  uuid,
  integer,
  type PgTableWithColumns,
} from 'drizzle-orm/pg-core';
import { publishedRecords } from './publishedRecord.sql';

export const cards: PgTableWithColumns<any> = pgTable('cards', {
  id: uuid('id').primaryKey(),
  authorId: text('author_id').notNull(),
  type: text('type').notNull(), // URL, NOTE, HIGHLIGHT
  contentData: jsonb('content_data').notNull(),
  url: text('url'), // Optional URL field for all card types
  parentCardId: uuid('parent_card_id').references(() => cards.id),
  publishedRecordId: uuid('published_record_id').references(
    () => publishedRecords.id,
  ),
  libraryCount: integer('library_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
