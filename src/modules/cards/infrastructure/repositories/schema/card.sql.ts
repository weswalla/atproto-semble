import {
  pgTable,
  text,
  timestamp,
  jsonb,
  uuid,
  integer,
  index,
  type PgTableWithColumns,
  sql,
} from 'drizzle-orm/pg-core';
import { publishedRecords } from './publishedRecord.sql';

export const cards: PgTableWithColumns<any> = pgTable(
  'cards',
  {
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
  },
  (table) => {
    return {
      // Critical for findUsersUrlCardByUrl queries
      authorUrlIdx: index('cards_author_url_idx').on(table.authorId, table.url),

      // For general card queries by author
      authorIdIdx: index('cards_author_id_idx').on(table.authorId),

      // Performance indexes
      // Optimizes sorting cards by type and update time in query results
      typeUpdatedAtIdx: index('idx_cards_type_updated_at')
        .on(table.type, table.updatedAt.desc()),
      // Covering index for getLibrariesForUrl - fast URL+type lookups with card ID included
      urlTypeIdx: index('idx_cards_url_type')
        .on(table.url, table.type)
        .include(table.id),
      // Partial index for finding NOTE cards by parent - only indexes NOTE type cards
      parentTypeIdx: index('idx_cards_parent_type')
        .on(table.parentCardId, table.type)
        .where(sql`type = 'NOTE'`),
    };
  },
);
