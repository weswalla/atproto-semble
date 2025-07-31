import { EnvironmentConfigService } from '../shared/infrastructure/config/EnvironmentConfigService';
import { RepositoryFactory } from '../shared/infrastructure/http/factories/RepositoryFactory';
import { ServiceFactory } from '../shared/infrastructure/http/factories/ServiceFactory';
import { CardAddedToLibraryEventHandler } from '../modules/feeds/application/eventHandlers/CardAddedToLibraryEventHandler';
import { QueueNames } from '../shared/infrastructure/events/QueueConfig';
import { EventNames } from '../shared/infrastructure/events/EventConfig';

async function startFeedWorker() {
  console.log('Starting feed worker...');

  const configService = new EnvironmentConfigService();
  
  // Create dependencies using factories
  const repositories = RepositoryFactory.create(configService);
  const services = ServiceFactory.createForWorker(configService, repositories);

  // Test Redis connection
  try {
    await services.redisConnection.ping();
    console.log('Connected to Redis successfully');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    process.exit(1);
  }

  // Create subscriber for feeds queue
  const eventSubscriber = services.createEventSubscriber(QueueNames.FEEDS);

  // Create event handlers with proper dependencies
  const feedService = {
    processCardAddedToLibrary: async (event: any) => {
      console.log('Processing feed update for card added to library:', event);
      // Your feed logic here - you can access all shared services here
      // services.profileService, services.metadataService, etc.
      return { isOk: () => true, isErr: () => false };
    },
  };

  const feedHandler = new CardAddedToLibraryEventHandler(feedService as any);

  // Register handlers
  await eventSubscriber.subscribe(EventNames.CARD_ADDED_TO_LIBRARY, feedHandler);

  // Start the worker
  await eventSubscriber.start();

  console.log('Feed worker started and listening for events...');

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down feed worker...');
    await eventSubscriber.stop();
    await services.redisConnection.quit();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startFeedWorker().catch((error) => {
  console.error('Failed to start feed worker:', error);
  process.exit(1);
});
