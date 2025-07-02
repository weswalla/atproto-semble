import { eq, desc, asc, count, sql, inArray } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  ICardQueryRepository,
  CardQueryOptions,
  PaginatedQueryResult,
  UrlCardQueryResultDTO,
  CardSortField,
  SortOrder,
} from "../../domain/ICardQueryRepository";
import { cards } from "./schema/card.sql";
import { collections, collectionCards } from "./schema/collection.sql";
import { libraryMemberships } from "./schema/libraryMembership.sql";
import { CardMapper, RawUrlCardData } from "./mappers/CardMapper";

export class DrizzleCardQueryRepository implements ICardQueryRepository {
  constructor(private db: PostgresJsDatabase) {}

  async getUrlCardsOfUser(
    userId: string,
    options: CardQueryOptions
  ): Promise<PaginatedQueryResult<UrlCardQueryResultDTO>> {
    try {
      const { page, limit, sortBy, sortOrder } = options;
      const offset = (page - 1) * limit;

      // Build the sort order
      const orderDirection = sortOrder === SortOrder.ASC ? asc : desc;

      // First, get the URL cards for the user from library memberships
      const urlCardsQuery = this.db
        .select({
          id: cards.id,
          url: cards.url,
          contentData: cards.contentData,
          libraryCount: cards.libraryCount,
          createdAt: cards.createdAt,
          updatedAt: cards.updatedAt,
        })
        .from(cards)
        .innerJoin(libraryMemberships, eq(cards.id, libraryMemberships.cardId))
        .where(
          sql`${libraryMemberships.userId} = ${userId} AND ${cards.type} = 'URL'`
        )
        .orderBy(orderDirection(this.getSortColumn(sortBy)))
        .limit(limit)
        .offset(offset);

      const urlCardsResult = await urlCardsQuery;

      if (urlCardsResult.length === 0) {
        return {
          items: [],
          totalCount: 0,
          hasMore: false,
        };
      }

      const cardIds = urlCardsResult.map(card => card.id);

      // Get collections for these cards
      const collectionsQuery = this.db
        .select({
          cardId: collectionCards.cardId,
          collectionId: collections.id,
          collectionName: collections.name,
          authorId: collections.authorId,
        })
        .from(collectionCards)
        .innerJoin(collections, eq(collectionCards.collectionId, collections.id))
        .where(inArray(collectionCards.cardId, cardIds));

      const collectionsResult = await collectionsQuery;

      // Get note cards for these URL cards (same user, parentCardId matches, type = NOTE)
      const notesQuery = this.db
        .select({
          id: cards.id,
          parentCardId: cards.parentCardId,
          contentData: cards.contentData,
        })
        .from(cards)
        .innerJoin(libraryMemberships, eq(cards.id, libraryMemberships.cardId))
        .where(
          sql`${libraryMemberships.userId} = ${userId} AND ${cards.type} = 'NOTE'`
        )
        .where(inArray(cards.parentCardId, cardIds));

      const notesResult = await notesQuery;

      // Get total count
      const totalCountResult = await this.db
        .select({ count: count() })
        .from(cards)
        .innerJoin(libraryMemberships, eq(cards.id, libraryMemberships.cardId))
        .where(
          sql`${libraryMemberships.userId} = ${userId} AND ${cards.type} = 'URL'`
        );

      const totalCount = totalCountResult[0]?.count || 0;
      const hasMore = offset + urlCardsResult.length < totalCount;

      // Combine the data
      const rawCardData: RawUrlCardData[] = urlCardsResult.map(card => {
        // Find collections for this card
        const cardCollections = collectionsResult
          .filter(c => c.cardId === card.id)
          .map(c => ({
            id: c.collectionId,
            name: c.collectionName,
            authorId: c.authorId,
          }));

        // Find note for this card
        const note = notesResult.find(n => n.parentCardId === card.id);

        return {
          id: card.id,
          url: card.url || "",
          contentData: card.contentData,
          libraryCount: card.libraryCount,
          createdAt: card.createdAt,
          updatedAt: card.updatedAt,
          collections: cardCollections,
          note: note ? {
            id: note.id,
            contentData: note.contentData,
          } : undefined,
        };
      });

      // Map to DTOs
      const items = rawCardData.map(raw => CardMapper.toUrlCardQueryResult(raw));

      return {
        items,
        totalCount,
        hasMore,
      };
    } catch (error) {
      console.error("Error in getUrlCardsOfUser:", error);
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
