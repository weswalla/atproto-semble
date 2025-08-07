import {
  pgTable,
  text,
  timestamp,
  primaryKey,
  index,
  uuid,
} from 'drizzle-orm/pg-core';
import { cards } from './card.sql';
import { publishedRecords } from 'src/modules/cards/infrastructure/repositories/schema/publishedRecord.sql';

export const libraryMemberships = pgTable(
  'library_memberships',
  {
    cardId: uuid('card_id')
      .notNull()
      .references(() => cards.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    addedAt: timestamp('added_at').notNull().defaultNow(),
    publishedRecordId: uuid('published_record_id').references(
      () => publishedRecords.id,
    ),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.cardId, table.userId] }),
      userCardsIdx: index('idx_user_cards').on(table.userId),
      cardUsersIdx: index('idx_card_users').on(table.cardId),
    };
  },
);
