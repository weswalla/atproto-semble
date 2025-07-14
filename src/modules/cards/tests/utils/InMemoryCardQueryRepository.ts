import {
  ICardQueryRepository,
  CardQueryOptions,
  UrlCardQueryResultDTO,
  CollectionCardQueryResultDTO,
  UrlCardViewDTO,
  PaginatedQueryResult,
  CardSortField,
  SortOrder,
} from "../../domain/ICardQueryRepository";
import { CardTypeEnum } from "../../domain/value-objects/CardType";
import { InMemoryCardRepository } from "./InMemoryCardRepository";
import { Card } from "../../domain/Card";

export class InMemoryCardQueryRepository implements ICardQueryRepository {
  private collectionCards: Map<string, Set<string>> = new Map(); // collectionId -> Set of cardIds

  constructor(private cardRepository: InMemoryCardRepository) {}

  async getUrlCardsOfUser(
    userId: string,
    options: CardQueryOptions
  ): Promise<PaginatedQueryResult<UrlCardQueryResultDTO>> {
    try {
      // Get all cards and filter by user's library membership
      const allCards = this.cardRepository.getAllCards();
      const userCards = allCards
        .filter((card) => card.isUrlCard && card.isInLibrary({ value: userId } as any))
        .map((card) => this.cardToUrlCardQueryResult(card));

      // Sort cards
      const sortedCards = this.sortCards(
        userCards,
        options.sortBy,
        options.sortOrder
      );

      // Apply pagination
      const startIndex = (options.page - 1) * options.limit;
      const endIndex = startIndex + options.limit;
      const paginatedCards = sortedCards.slice(startIndex, endIndex);

      return {
        items: paginatedCards,
        totalCount: userCards.length,
        hasMore: endIndex < userCards.length,
      };
    } catch (error) {
      throw new Error(
        `Failed to query URL cards: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private sortCards(
    cards: UrlCardQueryResultDTO[],
    sortBy: CardSortField,
    sortOrder: SortOrder
  ): UrlCardQueryResultDTO[] {
    const sorted = [...cards].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case CardSortField.CREATED_AT:
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case CardSortField.UPDATED_AT:
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
        case CardSortField.LIBRARY_COUNT:
          comparison = a.libraryCount - b.libraryCount;
          break;
        default:
          comparison = 0;
      }

      return sortOrder === SortOrder.DESC ? -comparison : comparison;
    });

    return sorted;
  }

  private cardToUrlCardQueryResult(card: Card): UrlCardQueryResultDTO {
    if (!card.isUrlCard || !card.content.urlContent) {
      throw new Error("Card is not a URL card");
    }

    // Find collections this card belongs to
    const collections: { id: string; name: string; authorId: string }[] = [];
    for (const [collectionId, cardIds] of this.collectionCards.entries()) {
      if (cardIds.has(card.cardId.getStringValue())) {
        // In a real implementation, you'd fetch collection details
        // For testing, we'll use placeholder data
        collections.push({
          id: collectionId,
          name: `Collection ${collectionId}`,
          authorId: "test-author",
        });
      }
    }

    return {
      id: card.cardId.getStringValue(),
      type: CardTypeEnum.URL,
      url: card.content.urlContent.url.value,
      cardContent: {
        url: card.content.urlContent.url.value,
        title: card.content.urlContent.metadata?.title,
        description: card.content.urlContent.metadata?.description,
        author: card.content.urlContent.metadata?.author,
        thumbnailUrl: card.content.urlContent.metadata?.imageUrl,
      },
      libraryCount: this.getLibraryCountForCard(card.cardId.getStringValue()),
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
      collections,
    };
  }

  private getLibraryCountForCard(cardId: string): number {
    const card = this.cardRepository.getStoredCard({ getStringValue: () => cardId } as any);
    return card ? card.libraryMembershipCount : 0;
  }

  async getCardsInCollection(
    collectionId: string,
    options: CardQueryOptions
  ): Promise<PaginatedQueryResult<CollectionCardQueryResultDTO>> {
    try {
      // Get cards in collection
      const collectionCardIds =
        this.collectionCards.get(collectionId) || new Set();
      const allCards = this.cardRepository.getAllCards();
      const collectionCards = allCards
        .filter(
          (card) =>
            collectionCardIds.has(card.cardId.getStringValue()) &&
            card.isUrlCard
        )
        .map((card) =>
          this.toCollectionCardQueryResult(this.cardToUrlCardQueryResult(card))
        );

      // Sort cards
      const sortedCards = this.sortCollectionCards(
        collectionCards,
        options.sortBy,
        options.sortOrder
      );

      // Apply pagination
      const startIndex = (options.page - 1) * options.limit;
      const endIndex = startIndex + options.limit;
      const paginatedCards = sortedCards.slice(startIndex, endIndex);

      return {
        items: paginatedCards,
        totalCount: collectionCards.length,
        hasMore: endIndex < collectionCards.length,
      };
    } catch (error) {
      throw new Error(
        `Failed to query collection cards: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private sortCollectionCards(
    cards: CollectionCardQueryResultDTO[],
    sortBy: CardSortField,
    sortOrder: SortOrder
  ): CollectionCardQueryResultDTO[] {
    const sorted = [...cards].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case CardSortField.CREATED_AT:
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case CardSortField.UPDATED_AT:
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
        case CardSortField.LIBRARY_COUNT:
          comparison = a.libraryCount - b.libraryCount;
          break;
        default:
          comparison = 0;
      }

      return sortOrder === SortOrder.DESC ? -comparison : comparison;
    });

    return sorted;
  }

  private toCollectionCardQueryResult(
    card: UrlCardQueryResultDTO
  ): CollectionCardQueryResultDTO {
    return {
      id: card.id,
      type: CardTypeEnum.URL,
      url: card.url,
      cardContent: card.cardContent,
      libraryCount: card.libraryCount,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
      note: card.note,
    };
  }

  // Test helper methods for collections
  addCardToCollection(collectionId: string, cardId: string): void {
    if (!this.collectionCards.has(collectionId)) {
      this.collectionCards.set(collectionId, new Set());
    }
    this.collectionCards.get(collectionId)!.add(cardId);
  }

  getCollectionCards(collectionId: string): string[] {
    return Array.from(this.collectionCards.get(collectionId) || new Set());
  }

  async getUrlCardView(cardId: string): Promise<UrlCardViewDTO | null> {
    const allCards = this.cardRepository.getAllCards();
    const card = allCards.find((c) => c.cardId.getStringValue() === cardId);
    if (!card || !card.isUrlCard) {
      return null;
    }

    const urlCardResult = this.cardToUrlCardQueryResult(card);

    // Get library memberships from the card itself
    const libraries = card.libraryMemberships.map((membership) => ({
      userId: membership.curatorId.value,
    }));

    return {
      ...urlCardResult,
      libraries,
    };
  }

  async getLibrariesForCard(cardId: string): Promise<string[]> {
    const allCards = this.cardRepository.getAllCards();
    const card = allCards.find((c) => c.cardId.getStringValue() === cardId);
    
    if (!card) {
      return [];
    }

    return card.libraryMemberships.map((membership) => membership.curatorId.value);
  }

  clear(): void {
    this.collectionCards.clear();
  }
}
