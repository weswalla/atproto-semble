import { CardAddedToCollectionEvent } from '../../../cards/domain/events/CardAddedToCollectionEvent';
import { IEventHandler } from '../../../../shared/application/events/IEventSubscriber';
import { Result } from '../../../../shared/core/Result';
import { CardCollectionSaga } from '../sagas/CardCollectionSaga';

export class CardAddedToCollectionEventHandler
  implements IEventHandler<CardAddedToCollectionEvent>
{
  constructor(private cardCollectionSaga: CardCollectionSaga) {}

  async handle(event: CardAddedToCollectionEvent): Promise<Result<void>> {
    return this.cardCollectionSaga.handleCardEvent(event);
  }
}
