import { CardAddedToLibraryEvent } from '../../../cards/domain/events/CardAddedToLibraryEvent';
import { IEventHandler } from '../../../../shared/application/events/IEventSubscriber';
import { Result } from '../../../../shared/core/Result';
import { CardCollectionSaga } from '../sagas/CardCollectionSaga';

export class CardAddedToLibraryEventHandler
  implements IEventHandler<CardAddedToLibraryEvent>
{
  constructor(private cardCollectionSaga: CardCollectionSaga) {}

  async handle(event: CardAddedToLibraryEvent): Promise<Result<void>> {
    return this.cardCollectionSaga.handleCardEvent(event);
  }
}
