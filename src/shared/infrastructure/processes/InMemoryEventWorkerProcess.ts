import { EnvironmentConfigService } from '../config/EnvironmentConfigService';
import {
  ServiceFactory,
  WorkerServices,
} from '../http/factories/ServiceFactory';
import { UseCaseFactory } from '../http/factories/UseCaseFactory';
import { CardAddedToLibraryEventHandler as FeedCardAddedToLibraryEventHandler } from '../../../modules/feeds/application/eventHandlers/CardAddedToLibraryEventHandler';
import { CardAddedToLibraryEventHandler as SearchCardAddedToLibraryEventHandler } from '../../../modules/search/application/eventHandlers/CardAddedToLibraryEventHandler';
import { CardAddedToCollectionEventHandler } from '../../../modules/feeds/application/eventHandlers/CardAddedToCollectionEventHandler';
import { CardCollectionSaga } from '../../../modules/feeds/application/sagas/CardCollectionSaga';
import { EventNames } from '../events/EventConfig';
import { IProcess } from '../../domain/IProcess';
import { IEventSubscriber } from '../../application/events/IEventSubscriber';
import {
  RepositoryFactory,
  Repositories,
} from '../http/factories/RepositoryFactory';

export class InMemoryEventWorkerProcess implements IProcess {
  constructor(private configService: EnvironmentConfigService) {}

  async start(): Promise<void> {
    console.log('Starting in-memory event worker...');

    const repositories = RepositoryFactory.create(this.configService);
    const services = ServiceFactory.createForWorker(
      this.configService,
      repositories,
    );

    const eventSubscriber = services.createEventSubscriber('feeds'); // Queue name doesn't matter for in-memory
    await this.registerHandlers(eventSubscriber, services, repositories);
    await eventSubscriber.start();

    console.log('In-memory event worker started');
  }

  private async registerHandlers(
    subscriber: IEventSubscriber,
    services: WorkerServices,
    repositories: Repositories,
  ): Promise<void> {
    const useCases = UseCaseFactory.createForWorker(repositories, services);

    // Feed handlers
    const cardCollectionSaga = new CardCollectionSaga(
      useCases.addActivityToFeedUseCase,
      services.sagaStateStore,
    );

    const feedCardAddedToLibraryHandler =
      new FeedCardAddedToLibraryEventHandler(cardCollectionSaga);
    const cardAddedToCollectionHandler = new CardAddedToCollectionEventHandler(
      cardCollectionSaga,
    );

    // Search handlers
    const searchCardAddedToLibraryHandler =
      new SearchCardAddedToLibraryEventHandler(
        useCases.indexUrlForSearchUseCase,
        repositories.cardRepository,
      );

    // Register feed handlers
    await subscriber.subscribe(
      EventNames.CARD_ADDED_TO_LIBRARY,
      feedCardAddedToLibraryHandler,
    );

    await subscriber.subscribe(
      EventNames.CARD_ADDED_TO_COLLECTION,
      cardAddedToCollectionHandler,
    );

    // Register search handlers
    await subscriber.subscribe(
      EventNames.CARD_ADDED_TO_LIBRARY,
      searchCardAddedToLibraryHandler,
    );
  }
}
