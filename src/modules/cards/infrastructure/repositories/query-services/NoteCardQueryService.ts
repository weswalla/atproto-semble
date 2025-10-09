import { eq, desc, asc, count, and } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import {
  CardQueryOptions,
  PaginatedQueryResult,
  NoteCardForUrlDTO,
  CardSortField,
  SortOrder,
} from '../../../domain/ICardQueryRepository';
import { cards } from '../schema/card.sql';
import { CardTypeEnum } from '../../../domain/value-objects/CardType';

export class NoteCardQueryService {
  constructor(private db: PostgresJsDatabase) {}

  async getNoteCardsForUrl(
    url: string,
    options: CardQueryOptions,
  ): Promise<PaginatedQueryResult<NoteCardForUrlDTO>> {
    try {
      const { page, limit, sortBy, sortOrder } = options;
      const offset = (page - 1) * limit;

      // Build the sort order
      const orderDirection = sortOrder === SortOrder.ASC ? asc : desc;

      // Get note cards with the specified URL
      const noteCardsQuery = this.db
        .select({
          id: cards.id,
          authorId: cards.authorId,
          contentData: cards.contentData,
          createdAt: cards.createdAt,
          updatedAt: cards.updatedAt,
        })
        .from(cards)
        .where(and(eq(cards.type, CardTypeEnum.NOTE), eq(cards.url, url)))
        .orderBy(orderDirection(this.getSortColumn(sortBy)))
        .limit(limit)
        .offset(offset);

      const noteCardsResult = await noteCardsQuery;

      // Get total count
      const totalCountResult = await this.db
        .select({ count: count() })
        .from(cards)
        .where(and(eq(cards.type, CardTypeEnum.NOTE), eq(cards.url, url)));

      const totalCount = totalCountResult[0]?.count || 0;
      const hasMore = offset + noteCardsResult.length < totalCount;

      // Map to DTOs
      const items: NoteCardForUrlDTO[] = noteCardsResult.map((card) => {
        const contentData = card.contentData as any;
        const noteText = contentData?.note?.text || '';

        return {
          id: card.id,
          note: noteText,
          authorId: card.authorId,
          createdAt: card.createdAt,
          updatedAt: card.updatedAt,
        };
      });

      return {
        items,
        totalCount,
        hasMore,
      };
    } catch (error) {
      console.error('Error in getNoteCardsForUrl:', error);
      throw error;
    }
  }

  private getSortColumn(sortBy: CardSortField) {
    switch (sortBy) {
      case CardSortField.CREATED_AT:
        return cards.createdAt;
      case CardSortField.UPDATED_AT:
        return cards.updatedAt;
      case CardSortField.LIBRARY_COUNT:
        return cards.libraryCount;
      default:
        return cards.updatedAt;
    }
  }
}
