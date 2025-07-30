import Redis from 'ioredis';
import { BullMQEventSubscriber } from '../shared/infrastructure/events/BullMQEventSubscriber';
import { CardAddedToLibraryEventHandler } from '../modules/notifications/application/eventHandlers/CardAddedToLibraryEventHandler';
import { EnvironmentConfigService } from '../shared/infrastructure/config/EnvironmentConfigService';

async function startNotificationWorker() {
  console.log('Starting notification worker...');
  
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
  const notificationService = {
    processCardAddedToLibrary: async (event: any) => {
      console.log('Processing notification for card added to library:', event);
      // Your notification logic here
      return { isOk: () => true, isErr: () => false };
    }
  };
  
  const notificationHandler = new CardAddedToLibraryEventHandler(notificationService as any);
  
  // Register handlers
  await eventSubscriber.subscribe('CardAddedToLibraryEvent', notificationHandler);
  
  // Start the worker - THIS IS WHAT TRIGGERS YOUR HANDLERS!
  await eventSubscriber.start();
  
  console.log('Notification worker started and listening for events...');

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Shutting down notification worker...');
    await eventSubscriber.stop();
    await redis.quit();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('Shutting down notification worker...');
    await eventSubscriber.stop();
    await redis.quit();
    process.exit(0);
  });
}

startNotificationWorker().catch((error) => {
  console.error('Failed to start notification worker:', error);
  process.exit(1);
});
