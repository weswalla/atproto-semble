import { Result, ok, err } from '../../../../shared/core/Result';
import { CardAddedToLibraryEvent } from '../../../cards/domain/events/CardAddedToLibraryEvent';
import { CardAddedToCollectionEvent } from '../../../cards/domain/events/CardAddedToCollectionEvent';
import {
  AddActivityToFeedUseCase,
  AddCardCollectedActivityDTO,
} from '../useCases/commands/AddActivityToFeedUseCase';
import { ActivityTypeEnum } from '../../domain/value-objects/ActivityType';

interface PendingCardActivity {
  cardId: string;
  actorId: string;
  collectionIds: string[];
  timestamp: Date;
  hasLibraryEvent: boolean;
  hasCollectionEvents: boolean;
}

export class CardCollectionSaga {
  private pendingActivities = new Map<string, PendingCardActivity>();
  private flushTimers = new Map<string, NodeJS.Timeout>();
  private readonly AGGREGATION_WINDOW_MS = 3000;

  constructor(private addActivityToFeedUseCase: AddActivityToFeedUseCase) {}

  async handleCardEvent(
    event: CardAddedToLibraryEvent | CardAddedToCollectionEvent,
  ): Promise<Result<void>> {
    try {
      const aggregationKey = this.createKey(event);
      const existing = this.pendingActivities.get(aggregationKey);

      if (existing && this.isWithinWindow(existing)) {
        // Merge with existing activity
        this.mergeActivity(existing, event);
        // Reset the timer
        this.rescheduleFlush(aggregationKey);
      } else {
        // Create new pending activity
        this.createPendingActivity(aggregationKey, event);
        this.scheduleFlush(aggregationKey);
      }

      return ok(undefined);
    } catch (error) {
      console.error('[SAGA] Error handling card event:', error);
      return err(error as Error);
    }
  }

  private createKey(
    event: CardAddedToLibraryEvent | CardAddedToCollectionEvent,
  ): string {
    const cardId = event.cardId.getStringValue();
    const actorId = this.getActorId(event);
    return `${cardId}-${actorId}`;
  }

  private getActorId(
    event: CardAddedToLibraryEvent | CardAddedToCollectionEvent,
  ): string {
    if ('curatorId' in event) {
      return event.curatorId.value; // CardAddedToLibraryEvent
    } else {
      return event.addedBy.value; // CardAddedToCollectionEvent
    }
  }

  private isWithinWindow(pending: PendingCardActivity): boolean {
    const now = new Date();
    const timeDiff = now.getTime() - pending.timestamp.getTime();
    return timeDiff <= this.AGGREGATION_WINDOW_MS;
  }

  private createPendingActivity(
    key: string,
    event: CardAddedToLibraryEvent | CardAddedToCollectionEvent,
  ): void {
    const cardId = event.cardId.getStringValue();
    const actorId = this.getActorId(event);

    const pending: PendingCardActivity = {
      cardId,
      actorId,
      collectionIds: [],
      timestamp: new Date(),
      hasLibraryEvent: false,
      hasCollectionEvents: false,
    };

    this.mergeActivity(pending, event);
    this.pendingActivities.set(key, pending);
  }

  private mergeActivity(
    existing: PendingCardActivity,
    event: CardAddedToLibraryEvent | CardAddedToCollectionEvent,
  ): void {
    if ('curatorId' in event) {
      // CardAddedToLibraryEvent
      existing.hasLibraryEvent = true;
    } else {
      // CardAddedToCollectionEvent
      existing.hasCollectionEvents = true;
      const collectionId = event.collectionId.getStringValue();
      if (!existing.collectionIds.includes(collectionId)) {
        existing.collectionIds.push(collectionId);
      }
    }
  }

  private scheduleFlush(key: string): void {
    const timer = setTimeout(() => {
      this.flushActivity(key);
    }, this.AGGREGATION_WINDOW_MS);

    this.flushTimers.set(key, timer);
  }

  private rescheduleFlush(key: string): void {
    // Clear existing timer
    const existingTimer = this.flushTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Schedule new timer
    this.scheduleFlush(key);
  }

  private async flushActivity(key: string): Promise<void> {
    const pending = this.pendingActivities.get(key);
    if (!pending) return;

    try {
      // Create the aggregated activity
      const request: AddCardCollectedActivityDTO = {
        type: ActivityTypeEnum.CARD_COLLECTED,
        actorId: pending.actorId,
        cardId: pending.cardId,
        collectionIds:
          pending.collectionIds.length > 0 ? pending.collectionIds : undefined,
      };

      const result = await this.addActivityToFeedUseCase.execute(request);

      if (result.isErr()) {
        console.error(
          '[SAGA] Failed to create aggregated activity:',
          result.error,
        );
      } else {
        console.log(
          `[SAGA] Successfully created aggregated activity ${result.value.activityId} for card ${pending.cardId}`,
        );
      }
    } catch (error) {
      console.error('[SAGA] Error flushing activity:', error);
    } finally {
      // Clean up
      this.pendingActivities.delete(key);
      this.flushTimers.delete(key);
    }
  }

  // For testing or graceful shutdown
  public async flushAll(): Promise<void> {
    const keys = Array.from(this.pendingActivities.keys());
    await Promise.all(keys.map((key) => this.flushActivity(key)));
  }
}
