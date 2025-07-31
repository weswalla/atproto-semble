import { CollectionCreatedEvent } from '../../../cards/domain/events/CollectionCreatedEvent';
import { IFeedService } from '../ports/IFeedService';
import { IEventHandler } from '../../../../shared/application/events/IEventSubscriber';
import { Result, ok, err } from '../../../../shared/core/Result';

export class CollectionCreatedEventHandler
  implements IEventHandler<CollectionCreatedEvent>
{
  constructor(private feedService: IFeedService) {}

  async handle(event: CollectionCreatedEvent): Promise<Result<void>> {
    try {
      console.log(
        `[FEEDS] Processing CollectionCreatedEvent for collection ${event.collectionId.getStringValue()} "${event.collectionName}" by ${event.authorId.value}`,
      );

      // For now, we'll just log the event - you can extend this to update feeds
      // const result = await this.feedService.processCollectionCreated(event);

      console.log(
        `[FEEDS] Successfully processed CollectionCreatedEvent for collection ${event.collectionId.getStringValue()}`,
      );
      return ok(undefined);
    } catch (error) {
      console.error(
        '[FEEDS] Unexpected error handling CollectionCreatedEvent:',
        error,
      );
      return err(error as Error);
    }
  }
}
