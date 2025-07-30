import Redis from 'ioredis';
import { BullMQEventSubscriber } from '../shared/infrastructure/events/BullMQEventSubscriber';
import { CardAddedToLibraryEventHandler } from '../modules/feeds/application/eventHandlers/CardAddedToLibraryEventHandler';
import { EnvironmentConfigService } from '../shared/infrastructure/config/EnvironmentConfigService';

async function startFeedWorker() {
  console.log('Starting feed worker...');
  
  const configService = new EnvironmentConfigService();
  
  // Connect to Redis
  const redisUrl = configService.get('REDIS_URL');
  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is required');
  }
  
  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    lazyConnect: true,
  });

  // Test Redis connection
  try {
    await redis.ping();
    console.log('Connected to Redis successfully');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    process.exit(1);
  }
  
  // Create subscriber
  const eventSubscriber = new BullMQEventSubscriber(redis);
  
  // Create event handlers (you'll need to inject dependencies here)
  // For now, creating a simple handler - you'll need to wire up your services
  const feedService = {
    processCardAddedToLibrary: async (event: any) => {
      console.log('Processing feed update for card added to library:', event);
      // Your feed logic here
      return { isOk: () => true, isErr: () => false };
    }
  };
  
  const feedHandler = new CardAddedToLibraryEventHandler(feedService as any);
  
  // Register handlers
  await eventSubscriber.subscribe('CardAddedToLibraryEvent', feedHandler);
  
  // Start the worker
  await eventSubscriber.start();
  
  console.log('Feed worker started and listening for events...');

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Shutting down feed worker...');
    await eventSubscriber.stop();
    await redis.quit();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('Shutting down feed worker...');
    await eventSubscriber.stop();
    await redis.quit();
    process.exit(0);
  });
}

startFeedWorker().catch((error) => {
  console.error('Failed to start feed worker:', error);
  process.exit(1);
});
