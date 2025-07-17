import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { ICardLibraryQueryService } from '../../application/services/ICardLibraryQueryService';
import { CardId } from '../../domain/value-objects/CardId';
import { libraryMemberships } from '../repositories/schema/libraryMembership.sql';
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
        .select({ cardId: libraryMemberships.cardId })
        .from(libraryMemberships)
        .where(eq(libraryMemberships.userId, userId));

      const cardIds: CardId[] = [];
      for (const result of results) {
        const cardIdResult = CardId.createFromString(result.cardId);
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
        .select({ cardId: libraryMemberships.cardId })
        .from(libraryMemberships)
        .where(
          eq(libraryMemberships.cardId, cardId.getStringValue()) &&
            eq(libraryMemberships.userId, userId),
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
      const results = await this.db
        .select({ cardId: libraryMemberships.cardId })
        .from(libraryMemberships)
        .where(eq(libraryMemberships.userId, userId));

      return ok(results.length);
    } catch (error) {
      return err(error as Error);
    }
  }
}
