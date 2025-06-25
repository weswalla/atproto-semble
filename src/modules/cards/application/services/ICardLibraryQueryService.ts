import { Result } from "../../../../shared/core/Result";
import { CardId } from "../../domain/value-objects/CardId";

export interface ICardLibraryQueryService {
  /**
   * Get all user IDs who have this card in their library
   */
  getLibrariesForCard(cardId: CardId): Promise<Result<string[]>>;

  /**
   * Get all card IDs in a user's library
   */
  getCardsInLibrary(userId: string): Promise<Result<CardId[]>>;

  /**
   * Check if a specific card is in a user's library
   */
  isCardInLibrary(cardId: CardId, userId: string): Promise<Result<boolean>>;

  /**
   * Get library membership count for a card
   */
  getLibraryMembershipCount(cardId: CardId): Promise<Result<number>>;

  /**
   * Get total number of cards in a user's library
   */
  getLibraryCardCount(userId: string): Promise<Result<number>>;
}
