import { eq, desc, asc, count, inArray, and } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import {
  ICardQueryRepository,
  CardQueryOptions,
  PaginatedQueryResult,
  UrlCardQueryResultDTO,
  CollectionCardQueryResultDTO,
  UrlCardViewDTO,
  CardSortField,
  SortOrder,
} from '../../domain/ICardQueryRepository';
import { cards } from './schema/card.sql';
import { collections, collectionCards } from './schema/collection.sql';
import { libraryMemberships } from './schema/libraryMembership.sql';
import { CardMapper, RawUrlCardData } from './mappers/CardMapper';
import { CardTypeEnum } from '../../domain/value-objects/CardType';

export class DrizzleCardQueryRepository implements ICardQueryRepository {
  constructor(private db: PostgresJsDatabase) {}

  async getUrlCardsOfUser(
    userId: string,
    options: CardQueryOptions,
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
          and(
            eq(libraryMemberships.userId, userId),
            eq(cards.type, CardTypeEnum.URL),
          ),
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

      const cardIds = urlCardsResult.map((card) => card.id);

      // Get collections for these cards
      const collectionsQuery = this.db
        .select({
          cardId: collectionCards.cardId,
          collectionId: collections.id,
          collectionName: collections.name,
          authorId: collections.authorId,
        })
        .from(collectionCards)
        .innerJoin(
          collections,
          eq(collectionCards.collectionId, collections.id),
        )
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
          and(
            eq(libraryMemberships.userId, userId),
            eq(cards.type, CardTypeEnum.NOTE),
            inArray(cards.parentCardId, cardIds),
          ),
        );

      const notesResult = await notesQuery;

      // Get total count
      const totalCountResult = await this.db
        .select({ count: count() })
        .from(cards)
        .innerJoin(libraryMemberships, eq(cards.id, libraryMemberships.cardId))
        .where(
          and(
            eq(libraryMemberships.userId, userId),
            eq(cards.type, CardTypeEnum.URL),
          ),
        );

      const totalCount = totalCountResult[0]?.count || 0;
      const hasMore = offset + urlCardsResult.length < totalCount;

      // Combine the data
      const rawCardData: RawUrlCardData[] = urlCardsResult.map((card) => {
        // Find collections for this card
        const cardCollections = collectionsResult
          .filter((c) => c.cardId === card.id)
          .map((c) => ({
            id: c.collectionId,
            name: c.collectionName,
            authorId: c.authorId,
          }));

        // Find note for this card
        const note = notesResult.find((n) => n.parentCardId === card.id);

        return {
          id: card.id,
          url: card.url || '',
          contentData: card.contentData,
          libraryCount: card.libraryCount,
          createdAt: card.createdAt,
          updatedAt: card.updatedAt,
          collections: cardCollections,
          note: note
            ? {
                id: note.id,
                contentData: note.contentData,
              }
            : undefined,
        };
      });

      // Map to DTOs
      const items = rawCardData.map((raw) =>
        CardMapper.toUrlCardQueryResult(raw),
      );

      return {
        items,
        totalCount,
        hasMore,
      };
    } catch (error) {
      console.error('Error in getUrlCardsOfUser:', error);
      throw error;
    }
  }

  async getCardsInCollection(
    collectionId: string,
    options: CardQueryOptions,
  ): Promise<PaginatedQueryResult<CollectionCardQueryResultDTO>> {
    try {
      const { page, limit, sortBy, sortOrder } = options;
      const offset = (page - 1) * limit;

      // Build the sort order
      const orderDirection = sortOrder === SortOrder.ASC ? asc : desc;

      // First, get the collection to know its author
      const collectionQuery = this.db
        .select({
          authorId: collections.authorId,
        })
        .from(collections)
        .where(eq(collections.id, collectionId));

      const collectionResult = await collectionQuery;

      if (collectionResult.length === 0) {
        return {
          items: [],
          totalCount: 0,
          hasMore: false,
        };
      }

      const collectionAuthorId = collectionResult[0]!.authorId;

      // Get URL cards in the collection
      const cardsQuery = this.db
        .select({
          id: cards.id,
          url: cards.url,
          contentData: cards.contentData,
          libraryCount: cards.libraryCount,
          createdAt: cards.createdAt,
          updatedAt: cards.updatedAt,
        })
        .from(cards)
        .innerJoin(collectionCards, eq(cards.id, collectionCards.cardId))
        .where(
          and(
            eq(collectionCards.collectionId, collectionId),
            eq(cards.type, CardTypeEnum.URL),
          ),
        )
        .orderBy(orderDirection(this.getSortColumn(sortBy)))
        .limit(limit)
        .offset(offset);

      const cardsResult = await cardsQuery;

      if (cardsResult.length === 0) {
        return {
          items: [],
          totalCount: 0,
          hasMore: false,
        };
      }

      const cardIds = cardsResult.map((card) => card.id);

      // Get note cards for these URL cards, but only by the collection author
      const notesQuery = this.db
        .select({
          id: cards.id,
          parentCardId: cards.parentCardId,
          contentData: cards.contentData,
        })
        .from(cards)
        .innerJoin(libraryMemberships, eq(cards.id, libraryMemberships.cardId))
        .where(
          and(
            eq(cards.type, CardTypeEnum.NOTE),
            inArray(cards.parentCardId, cardIds),
            eq(libraryMemberships.userId, collectionAuthorId),
          ),
        );

      const notesResult = await notesQuery;

      // Get total count
      const totalCountResult = await this.db
        .select({ count: count() })
        .from(cards)
        .innerJoin(collectionCards, eq(cards.id, collectionCards.cardId))
        .where(
          and(
            eq(collectionCards.collectionId, collectionId),
            eq(cards.type, CardTypeEnum.URL),
          ),
        );

      const totalCount = totalCountResult[0]?.count || 0;
      const hasMore = offset + cardsResult.length < totalCount;

      // Combine the data
      const rawCardData = cardsResult.map((card) => {
        // Find note for this card
        const note = notesResult.find((n) => n.parentCardId === card.id);

        return {
          id: card.id,
          url: card.url || '',
          contentData: card.contentData,
          libraryCount: card.libraryCount,
          createdAt: card.createdAt,
          updatedAt: card.updatedAt,
          note: note
            ? {
                id: note.id,
                contentData: note.contentData,
              }
            : undefined,
        };
      });

      // Map to DTOs
      const items = rawCardData.map((raw) =>
        CardMapper.toCollectionCardQueryResult(raw),
      );

      return {
        items,
        totalCount,
        hasMore,
      };
    } catch (error) {
      console.error('Error in getCardsInCollection:', error);
      throw error;
    }
  }

  async getUrlCardView(cardId: string): Promise<UrlCardViewDTO | null> {
    try {
      // Get the URL card
      const cardQuery = this.db
        .select({
          id: cards.id,
          type: cards.type,
          url: cards.url,
          contentData: cards.contentData,
          libraryCount: cards.libraryCount,
          createdAt: cards.createdAt,
          updatedAt: cards.updatedAt,
        })
        .from(cards)
        .where(and(eq(cards.id, cardId), eq(cards.type, CardTypeEnum.URL)));

      const cardResult = await cardQuery;

      if (cardResult.length === 0) {
        return null;
      }

      const card = cardResult[0]!;

      // Get users who have this card in their libraries
      const libraryQuery = this.db
        .select({
          userId: libraryMemberships.userId,
        })
        .from(libraryMemberships)
        .where(eq(libraryMemberships.cardId, cardId));

      const libraryResult = await libraryQuery;

      // Get collections that contain this card
      const collectionsQuery = this.db
        .select({
          collectionId: collections.id,
          collectionName: collections.name,
          authorId: collections.authorId,
        })
        .from(collectionCards)
        .innerJoin(
          collections,
          eq(collectionCards.collectionId, collections.id),
        )
        .where(eq(collectionCards.cardId, cardId));

      const collectionsResult = await collectionsQuery;

      // Get note card for this URL card (parentCardId matches, type = NOTE)
      const noteQuery = this.db
        .select({
          id: cards.id,
          parentCardId: cards.parentCardId,
          contentData: cards.contentData,
        })
        .from(cards)
        .where(
          and(
            eq(cards.type, CardTypeEnum.NOTE),
            eq(cards.parentCardId, cardId),
          ),
        );

      const noteResult = await noteQuery;
      const note = noteResult.length > 0 ? noteResult[0] : undefined;

      // Map to DTO
      const urlCardView = CardMapper.toUrlCardViewDTO({
        id: card.id,
        type: card.type,
        url: card.url || '',
        contentData: card.contentData,
        libraryCount: card.libraryCount,
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
        inLibraries: libraryResult.map((lib) => ({ userId: lib.userId })),
        inCollections: collectionsResult.map((coll) => ({
          id: coll.collectionId,
          name: coll.collectionName,
          authorId: coll.authorId,
        })),
        note: note
          ? {
              id: note.id,
              contentData: note.contentData,
            }
          : undefined,
      });

      return urlCardView;
    } catch (error) {
      console.error('Error in getUrlCardView:', error);
      throw error;
    }
  }

  async getLibrariesForCard(cardId: string): Promise<string[]> {
    try {
      // Get all users who have this card in their library
      const libraryQuery = this.db
        .select({
          userId: libraryMemberships.userId,
        })
        .from(libraryMemberships)
        .where(eq(libraryMemberships.cardId, cardId));

      const libraryResult = await libraryQuery;

      return libraryResult.map((lib) => lib.userId);
    } catch (error) {
      console.error('Error in getLibrariesForCard:', error);
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
