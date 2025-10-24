import { EnvironmentConfigService } from '../config/EnvironmentConfigService';
import {
  ServiceFactory,
  WorkerServices,
} from '../http/factories/ServiceFactory';
import { UseCaseFactory } from '../http/factories/UseCaseFactory';
import { CardAddedToLibraryEventHandler } from '../../../modules/feeds/application/eventHandlers/CardAddedToLibraryEventHandler';
import { CardAddedToCollectionEventHandler } from '../../../modules/feeds/application/eventHandlers/CardAddedToCollectionEventHandler';
import { CardCollectionSaga } from '../../../modules/feeds/application/sagas/CardCollectionSaga';
import { RedisSagaStateStore } from '../../../modules/feeds/infrastructure/RedisSagaStateStore';
import { InMemorySagaStateStore } from '../../../modules/feeds/infrastructure/InMemorySagaStateStore';
import { QueueNames } from '../events/QueueConfig';
import { EventNames } from '../events/EventConfig';
import { BaseWorkerProcess } from './BaseWorkerProcess';
import { IEventSubscriber } from '../../application/events/IEventSubscriber';
import { Repositories } from '../http/factories/RepositoryFactory';

export class FeedWorkerProcess extends BaseWorkerProcess {
  constructor(configService: EnvironmentConfigService) {
    super(configService, QueueNames.FEEDS);
  }

  protected createServices(repositories: Repositories): WorkerServices {
    return ServiceFactory.createForWorker(this.configService, repositories);
  }

  protected async validateDependencies(
    services: WorkerServices,
  ): Promise<void> {
    if (!services.redisConnection) {
      throw new Error('Redis connection required for feed worker');
    }
    await services.redisConnection.ping();
  }

  protected async registerHandlers(
    subscriber: IEventSubscriber,
    services: WorkerServices,
    repositories: Repositories,
  ): Promise<void> {
    const useCases = UseCaseFactory.createForWorker(repositories, services);

    // Create saga with proper use case dependency and state store from services
    const cardCollectionSaga = new CardCollectionSaga(
      useCases.addActivityToFeedUseCase,
      services.sagaStateStore,
    );

    const cardAddedToLibraryHandler = new CardAddedToLibraryEventHandler(
      cardCollectionSaga,
    );
    const cardAddedToCollectionHandler = new CardAddedToCollectionEventHandler(
      cardCollectionSaga,
    );

    await subscriber.subscribe(
      EventNames.CARD_ADDED_TO_LIBRARY,
      cardAddedToLibraryHandler,
    );

    await subscriber.subscribe(
      EventNames.CARD_ADDED_TO_COLLECTION,
      cardAddedToCollectionHandler,
    );
  }
}
