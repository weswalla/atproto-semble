import { IProcess } from '../../domain/IProcess';
import { EnvironmentConfigService } from '../config/EnvironmentConfigService';
import { RepositoryFactory } from '../http/factories/RepositoryFactory';
import { ServiceFactory } from '../http/factories/ServiceFactory';
import { UseCaseFactory } from '../http/factories/UseCaseFactory';
import { CardAddedToLibraryEventHandler } from '../../../modules/feeds/application/eventHandlers/CardAddedToLibraryEventHandler';
import { CardAddedToCollectionEventHandler } from '../../../modules/feeds/application/eventHandlers/CardAddedToCollectionEventHandler';
import { CardCollectionSaga } from '../../../modules/feeds/application/sagas/CardCollectionSaga';
import { QueueNames } from '../events/QueueConfig';
import { EventNames } from '../events/EventConfig';

export class FeedWorkerProcess implements IProcess {
  constructor(private configService: EnvironmentConfigService) {}

  async start(): Promise<void> {
    console.log('Starting feed worker...');

    // Create dependencies using factories
    const repositories = RepositoryFactory.create(this.configService);
    const services = ServiceFactory.createForWorker(
      this.configService,
      repositories,
    );
    const useCases = UseCaseFactory.createForWorker(repositories, services);

    // Test Redis connection (only if using Redis)
    if (services.redisConnection) {
      try {
        await services.redisConnection.ping();
        console.log('Connected to Redis successfully');
      } catch (error) {
        console.error('Failed to connect to Redis:', error);
        process.exit(1);
      }
    } else {
      console.log('Using in-memory event system');
    }

    // Create subscriber for feeds queue
    const eventSubscriber = services.createEventSubscriber(QueueNames.FEEDS);

    // Create the saga with proper dependencies
    const cardCollectionSaga = new CardCollectionSaga(
      useCases.addActivityToFeedUseCase,
    );

    // Create event handlers with the saga
    const cardAddedToLibraryHandler = new CardAddedToLibraryEventHandler(
      cardCollectionSaga,
    );
    const cardAddedToCollectionHandler = new CardAddedToCollectionEventHandler(
      cardCollectionSaga,
    );

    // Register handlers
    await eventSubscriber.subscribe(
      EventNames.CARD_ADDED_TO_LIBRARY,
      cardAddedToLibraryHandler,
    );

    await eventSubscriber.subscribe(
      EventNames.CARD_ADDED_TO_COLLECTION,
      cardAddedToCollectionHandler,
    );

    // Start the worker
    await eventSubscriber.start();

    console.log('Feed worker started and listening for events...');

    // Graceful shutdown
    const shutdown = async () => {
      console.log('Shutting down feed worker...');
      await eventSubscriber.stop();
      if (services.redisConnection) {
        await services.redisConnection.quit();
      }
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  }
}
