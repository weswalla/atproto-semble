import {
  pgTable,
  text,
  timestamp,
  primaryKey,
  index,
  uuid,
} from "drizzle-orm/pg-core";
import { cards } from "./card.sql";
import { publishedRecords } from "src/modules/annotations/infrastructure/repositories/schema/publishedRecord.sql";

export const libraryMemberships = pgTable("library_memberships", {
  cardId: text("card_id")
    .notNull()
    .references(() => cards.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  addedAt: timestamp("added_at").notNull().defaultNow(),
  publishedRecordId: uuid("published_record_id").references(
    () => publishedRecords.id
  ),
});

export const libraryMembershipsPk = primaryKey({
  columns: [libraryMemberships.cardId, libraryMemberships.userId],
});

export const userCardsIdx = index("idx_user_cards").on(
  libraryMemberships.userId
);
export const cardUsersIdx = index("idx_card_users").on(
  libraryMemberships.cardId
);
