import {
  pgTable,
  text,
  timestamp,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { cards } from "./card.sql";

export const libraryMemberships = pgTable(
  "library_memberships",
  {
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    addedAt: timestamp("added_at").notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.cardId, table.userId] }),
    userCardsIdx: index("idx_user_cards").on(table.userId),
    cardUsersIdx: index("idx_card_users").on(table.cardId),
  })
);
