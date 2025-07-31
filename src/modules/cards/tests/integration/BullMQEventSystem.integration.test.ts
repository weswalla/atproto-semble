import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import Redis from 'ioredis';
import { BullMQEventPublisher } from '../../../../shared/infrastructure/events/BullMQEventPublisher';
import { BullMQEventSubscriber } from '../../../../shared/infrastructure/events/BullMQEventSubscriber';
import { CardAddedToLibraryEvent } from '../../domain/events/CardAddedToLibraryEvent';
import { CardId } from '../../domain/value-objects/CardId';
import { CuratorId } from '../../domain/value-objects/CuratorId';
import { IEventHandler } from '../../../../shared/application/events/IEventSubscriber';
import { Result, ok, err } from '../../../../shared/core/Result';

describe('BullMQ Event System Integration', () => {
  let redisContainer: StartedRedisContainer;
  let redis: Redis;
  let publisher: BullMQEventPublisher;
  let subscriber: BullMQEventSubscriber;

  beforeAll(async () => {
    // Start Redis container
    redisContainer = await new RedisContainer('redis:7-alpine')
      .withExposedPorts(6379)
      .start();

    // Create Redis connection
    const connectionUrl = redisContainer.getConnectionUrl();
    redis = new Redis(connectionUrl, { maxRetriesPerRequest: null });

    // Create publisher and subscriber
    publisher = new BullMQEventPublisher(redis);
    subscriber = new BullMQEventSubscriber(redis);
  }, 60000); // Increase timeout for container startup

  afterAll(async () => {
    // Clean up
    if (subscriber) {
      await subscriber.stop();
    }
    if (publisher) {
      await publisher.close();
    }
    if (redis) {
      await redis.quit();
    }
    if (redisContainer) {
      await redisContainer.stop();
    }
  });

  beforeEach(async () => {
    // Clear Redis data between tests
    await redis.flushall();
  });

  describe('Event Publishing and Subscription', () => {
    it('should publish and receive CardAddedToLibraryEvent', async () => {
      // Arrange
      const receivedEvents: CardAddedToLibraryEvent[] = [];
      const mockHandler: IEventHandler<CardAddedToLibraryEvent> = {
        handle: jest
          .fn()
          .mockImplementation(async (event: CardAddedToLibraryEvent) => {
            receivedEvents.push(event);
            return ok(undefined);
          }),
      };

      // Subscribe to events
      await subscriber.subscribe('CardAddedToLibraryEvent', mockHandler);
      await subscriber.start();

      // Create test event
      const cardId = CardId.createFromString('test-card-123').unwrap();
      const curatorId = CuratorId.create('did:plc:testuser123').unwrap();
      const event = new CardAddedToLibraryEvent(cardId, curatorId);

      // Act - Publish event
      const publishResult = await publisher.publishEvents([event]);

      // Assert - Publishing succeeded
      expect(publishResult.isOk()).toBe(true);

      // Wait for event processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Assert - Event was received and processed
      expect(mockHandler.handle).toHaveBeenCalledTimes(1);
      expect(receivedEvents).toHaveLength(1);

      const receivedEvent = receivedEvents[0];
      expect(receivedEvent).toBeInstanceOf(CardAddedToLibraryEvent);
      expect(receivedEvent!.cardId.getStringValue()).toBe(
        cardId.getStringValue(),
      );
      expect(receivedEvent!.curatorId.value).toBe(curatorId.value);
      expect(receivedEvent!.dateTimeOccurred).toBeInstanceOf(Date);
    }, 15000);

    it('should publish and receive multiple events in sequence', async () => {
      // Arrange
      const receivedEvents: CardAddedToLibraryEvent[] = [];
      const mockHandler: IEventHandler<CardAddedToLibraryEvent> = {
        handle: jest
          .fn()
          .mockImplementation(async (event: CardAddedToLibraryEvent) => {
            receivedEvents.push(event);
            return ok(undefined);
          }),
      };

      await subscriber.subscribe('CardAddedToLibraryEvent', mockHandler);
      await subscriber.start();

      // Create multiple test events
      const events = [
        new CardAddedToLibraryEvent(
          CardId.createFromString('card-1').unwrap(),
          CuratorId.create('did:plc:user1').unwrap(),
        ),
        new CardAddedToLibraryEvent(
          CardId.createFromString('card-2').unwrap(),
          CuratorId.create('did:plc:user2').unwrap(),
        ),
        new CardAddedToLibraryEvent(
          CardId.createFromString('card-3').unwrap(),
          CuratorId.create('did:plc:user3').unwrap(),
        ),
      ];

      // Act - Publish all events
      const publishResult = await publisher.publishEvents(events);

      // Assert - Publishing succeeded
      expect(publishResult.isOk()).toBe(true);

      // Wait for event processing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Assert - All events were received
      expect(mockHandler.handle).toHaveBeenCalledTimes(3);
      expect(receivedEvents).toHaveLength(3);

      // Verify each event was processed correctly
      const cardIds = receivedEvents.map((e) => e.cardId.getStringValue());
      expect(cardIds).toContain('card-1');
      expect(cardIds).toContain('card-2');
      expect(cardIds).toContain('card-3');
    }, 20000);

    it('should handle event processing failures gracefully', async () => {
      // Arrange
      let callCount = 0;
      const mockHandler: IEventHandler<CardAddedToLibraryEvent> = {
        handle: jest.fn().mockImplementation(async () => {
          callCount++;
          if (callCount === 1) {
            // First call fails
            return err(new Error('Processing failed'));
          }
          // Subsequent calls succeed (for retry)
          return ok(undefined);
        }),
      };

      await subscriber.subscribe('CardAddedToLibraryEvent', mockHandler);
      await subscriber.start();

      const event = new CardAddedToLibraryEvent(
        CardId.createFromString('failing-card').unwrap(),
        CuratorId.create('did:plc:failuser').unwrap(),
      );

      // Act - Publish event that will initially fail
      const publishResult = await publisher.publishEvents([event]);

      // Assert - Publishing succeeded (failure happens during processing)
      expect(publishResult.isOk()).toBe(true);

      // Wait for initial processing and potential retries
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Assert - Handler was called (at least once for initial attempt)
      expect(mockHandler.handle).toHaveBeenCalled();
    }, 25000);

    it('should not process events when no handler is registered', async () => {
      // Arrange - Start subscriber without registering any handlers
      await subscriber.start();

      const event = new CardAddedToLibraryEvent(
        CardId.createFromString('unhandled-card').unwrap(),
        CuratorId.create('did:plc:unhandleduser').unwrap(),
      );

      // Act - Publish event
      const publishResult = await publisher.publishEvents([event]);

      // Assert - Publishing succeeded (no handler doesn't prevent publishing)
      expect(publishResult.isOk()).toBe(true);

      // Wait to ensure no processing occurs
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // No assertions needed - test passes if no errors are thrown
    }, 10000);

    it('should maintain event data integrity during serialization/deserialization', async () => {
      // Arrange
      let receivedEvent: CardAddedToLibraryEvent | null = null;
      const mockHandler: IEventHandler<CardAddedToLibraryEvent> = {
        handle: jest
          .fn()
          .mockImplementation(async (event: CardAddedToLibraryEvent) => {
            receivedEvent = event;
            return ok(undefined);
          }),
      };

      await subscriber.subscribe('CardAddedToLibraryEvent', mockHandler);
      await subscriber.start();

      // Create event with specific data
      const originalCardId = CardId.createFromString(
        'integrity-test-card-456',
      ).unwrap();
      const originalCuratorId = CuratorId.create(
        'did:plc:integrityuser789',
      ).unwrap();
      const originalEvent = new CardAddedToLibraryEvent(
        originalCardId,
        originalCuratorId,
      );
      const originalTimestamp = originalEvent.dateTimeOccurred;

      // Act
      await publisher.publishEvents([originalEvent]);
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Assert - Event data was preserved through serialization/deserialization
      expect(receivedEvent).not.toBeNull();
      expect(receivedEvent!.cardId.getStringValue()).toBe(
        originalCardId.getStringValue(),
      );
      expect(receivedEvent!.curatorId.value).toBe(originalCuratorId.value);
      expect(receivedEvent!.dateTimeOccurred.getTime()).toBe(
        originalTimestamp.getTime(),
      );
      expect(receivedEvent!.getAggregateId().toString()).toBe(
        originalCardId.getValue().toString(),
      );
    }, 15000);
  });

  describe('Queue Configuration', () => {
    it('should route events to the events queue', async () => {
      // This test verifies the queue routing logic by checking Redis directly
      const event = new CardAddedToLibraryEvent(
        CardId.createFromString('queue-test-card').unwrap(),
        CuratorId.create('did:plc:queueuser').unwrap(),
      );

      await publisher.publishEvents([event]);

      // Check that job was added to the events queue
      const queueKeys = await redis.keys('bull:events:*');
      expect(queueKeys.length).toBeGreaterThan(0);

      // Verify the job data structure
      const waitingJobs = await redis.lrange(
        'bull:events:waiting',
        0,
        -1,
      );
      expect(waitingJobs.length).toBe(1);
    }, 10000);
  });
});
