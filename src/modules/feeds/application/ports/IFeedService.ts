import { Result } from '../../../../shared/core/Result';
import { UseCaseError } from '../../../../shared/core/UseCaseError';
import { CardAddedToLibraryEvent } from '../../../cards/domain/events/CardAddedToLibraryEvent';

export interface FeedEntry {
  id: string;
  userId: string;
  actorId: string;
  actorHandle?: string;
  action: 'added_card_to_library';
  cardId: string;
  cardType: string;
  cardTitle?: string;
  cardUrl?: string;
  timestamp: Date;
}

export interface IFeedService {
  /**
   * Process a card added to library event and distribute to relevant feeds
   */
  processCardAddedToLibrary(
    event: CardAddedToLibraryEvent,
  ): Promise<Result<void, UseCaseError>>;

  /**
   * Get feed entries for a specific user
   */
  getUserFeed(
    userId: string,
    page: number,
    limit: number,
  ): Promise<Result<FeedEntry[], UseCaseError>>;

  /**
   * Get public feed entries
   */
  getPublicFeed(
    page: number,
    limit: number,
  ): Promise<Result<FeedEntry[], UseCaseError>>;
}
