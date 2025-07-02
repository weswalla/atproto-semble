import {
  ICardQueryRepository,
  CardQueryOptions,
  UrlCardQueryResultDTO,
  PaginatedQueryResult,
  CardSortField,
  SortOrder,
} from "../../domain/ICardQueryRepository";

export class InMemoryCardQueryRepository implements ICardQueryRepository {
  private urlCards: Map<string, UrlCardQueryResultDTO> = new Map();
  private userLibraries: Map<string, Set<string>> = new Map(); // userId -> Set of cardIds

  async getUrlCardsOfUser(
    userId: string,
    options: CardQueryOptions
  ): Promise<PaginatedQueryResult<UrlCardQueryResultDTO>> {
    try {
      // Get cards in user's library
      const userCardIds = this.userLibraries.get(userId) || new Set();
      const userCards = Array.from(this.urlCards.values()).filter(card =>
        userCardIds.has(card.id)
      );

      // Sort cards
      const sortedCards = this.sortCards(userCards, options.sortBy, options.sortOrder);

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

  // Test helper methods
  addUrlCard(card: UrlCardQueryResultDTO): void {
    this.urlCards.set(card.id, card);
  }

  addCardToUserLibrary(userId: string, cardId: string): void {
    if (!this.userLibraries.has(userId)) {
      this.userLibraries.set(userId, new Set());
    }
    this.userLibraries.get(userId)!.add(cardId);
  }

  clear(): void {
    this.urlCards.clear();
    this.userLibraries.clear();
  }

  getStoredCard(id: string): UrlCardQueryResultDTO | undefined {
    return this.urlCards.get(id);
  }

  getAllCards(): UrlCardQueryResultDTO[] {
    return Array.from(this.urlCards.values());
  }

  getUserLibrary(userId: string): string[] {
    return Array.from(this.userLibraries.get(userId) || new Set());
  }
}
