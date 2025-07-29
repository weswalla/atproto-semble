import { Result } from '../../../../shared/core/Result';
import { UseCaseError } from '../../../../shared/core/UseCaseError';
import { CardAddedToLibraryEvent } from '../../../cards/domain/events/CardAddedToLibraryEvent';

export interface Notification {
  id: string;
  userId: string;
  type: 'card_added_to_library';
  actorId: string;
  actorHandle?: string;
  cardId: string;
  cardTitle?: string;
  cardUrl?: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface INotificationService {
  /**
   * Process a card added to library event and create notifications for relevant users
   */
  processCardAddedToLibrary(
    event: CardAddedToLibraryEvent,
  ): Promise<Result<void, UseCaseError>>;

  /**
   * Get notifications for a specific user
   */
  getUserNotifications(
    userId: string,
    page: number,
    limit: number,
    unreadOnly?: boolean,
  ): Promise<Result<Notification[], UseCaseError>>;

  /**
   * Mark notification as read
   */
  markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<Result<void, UseCaseError>>;

  /**
   * Mark all notifications as read for a user
   */
  markAllAsRead(userId: string): Promise<Result<void, UseCaseError>>;

  /**
   * Get unread notification count for a user
   */
  getUnreadCount(userId: string): Promise<Result<number, UseCaseError>>;
}
