import { IProcess } from '../../domain/IProcess';
import { EnvironmentConfigService } from '../config/EnvironmentConfigService';
import { InMemoryEventSubscriber } from '../events/InMemoryEventSubscriber';
import { CardAddedToLibraryEventHandler } from '../../../modules/feeds/application/eventHandlers/CardAddedToLibraryEventHandler';
import { CardAddedToCollectionEventHandler } from '../../../modules/feeds/application/eventHandlers/CardAddedToCollectionEventHandler';
import { CardCollectionSaga } from '../../../modules/feeds/application/sagas/CardCollectionSaga';
import { InMemorySagaStateStore } from '../../../modules/feeds/infrastructure/InMemorySagaStateStore';
import { EventNames } from '../events/EventConfig';
import { RepositoryFactory } from '../http/factories/RepositoryFactory';
import { ServiceFactory } from '../http/factories/ServiceFactory';
import { UseCaseFactory } from '../http/factories/UseCaseFactory';

export class InMemoryEventWorkerProcess implements IProcess {
  constructor(private configService: EnvironmentConfigService) {}

  async start(): Promise<void> {
    console.log('Starting in-memory event worker...');

    // Create dependencies
    const repositories = RepositoryFactory.create(this.configService);
    const services = ServiceFactory.createForWebApp(
      this.configService,
      repositories,
    );
    const useCases = UseCaseFactory.createForWorker(repositories, services);

    // Create in-memory saga state store
    const stateStore = new InMemorySagaStateStore();
    const cardCollectionSaga = new CardCollectionSaga(
      useCases.addActivityToFeedUseCase,
      stateStore,
    );

    // Create event subscriber
    const eventSubscriber = new InMemoryEventSubscriber();

    // Create and register event handlers
    const cardAddedToLibraryHandler = new CardAddedToLibraryEventHandler(
      cardCollectionSaga,
    );
    const cardAddedToCollectionHandler = new CardAddedToCollectionEventHandler(
      cardCollectionSaga,
    );

    await eventSubscriber.subscribe(
      EventNames.CARD_ADDED_TO_LIBRARY,
      cardAddedToLibraryHandler,
    );

    await eventSubscriber.subscribe(
      EventNames.CARD_ADDED_TO_COLLECTION,
      cardAddedToCollectionHandler,
    );

    // Start the subscriber
    await eventSubscriber.start();

    console.log('In-memory event worker started');
  }
}
