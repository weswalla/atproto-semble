import { eq, and, count } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { ICardLibraryQueryService } from '../../application/services/ICardLibraryQueryService';
import { CardId } from '../../domain/value-objects/CardId';
import { libraryMemberships } from '../repositories/schema/libraryMembership.sql';
import { cards } from '../repositories/schema/card.sql';
import { Result, ok, err } from '../../../../shared/core/Result';

export class DrizzleCardLibraryQueryService
  implements ICardLibraryQueryService
{
  constructor(private db: PostgresJsDatabase) {}

  async getLibrariesForCard(cardId: CardId): Promise<Result<string[]>> {
    try {
      const results = await this.db
        .select({ userId: libraryMemberships.userId })
        .from(libraryMemberships)
        .where(eq(libraryMemberships.cardId, cardId.getStringValue()));

      return ok(results.map((r) => r.userId));
    } catch (error) {
      return err(error as Error);
    }
  }

  async getCardsInLibrary(userId: string): Promise<Result<CardId[]>> {
    try {
      const results = await this.db
        .select({ id: cards.id })
        .from(cards)
        .where(eq(cards.authorId, userId));

      const cardIds: CardId[] = [];
      for (const result of results) {
        const cardIdResult = CardId.createFromString(result.id);
        if (cardIdResult.isOk()) {
          cardIds.push(cardIdResult.value);
        }
      }

      return ok(cardIds);
    } catch (error) {
      return err(error as Error);
    }
  }

  async isCardInLibrary(
    cardId: CardId,
    userId: string,
  ): Promise<Result<boolean>> {
    try {
      const result = await this.db
        .select({ id: cards.id })
        .from(cards)
        .where(
          and(
            eq(cards.id, cardId.getStringValue()),
            eq(cards.authorId, userId),
          ),
        )
        .limit(1);

      return ok(result.length > 0);
    } catch (error) {
      return err(error as Error);
    }
  }

  async getLibraryMembershipCount(cardId: CardId): Promise<Result<number>> {
    try {
      const results = await this.db
        .select({ userId: libraryMemberships.userId })
        .from(libraryMemberships)
        .where(eq(libraryMemberships.cardId, cardId.getStringValue()));

      return ok(results.length);
    } catch (error) {
      return err(error as Error);
    }
  }

  async getLibraryCardCount(userId: string): Promise<Result<number>> {
    try {
      const result = await this.db
        .select({ count: count() })
        .from(cards)
        .where(eq(cards.authorId, userId));

      return ok(result[0]?.count || 0);
    } catch (error) {
      return err(error as Error);
    }
  }
}
