import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import postgres from 'postgres';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DrizzleFeedRepository } from '../../infrastructure/repositories/DrizzleFeedRepository';
import { FeedActivity } from '../../domain/FeedActivity';
import { CuratorId } from '../../../cards/domain/value-objects/CuratorId';
import { CardId } from '../../../cards/domain/value-objects/CardId';
import { CollectionId } from '../../../cards/domain/value-objects/CollectionId';
import { feedActivities } from '../../infrastructure/repositories/schema/feedActivity.sql';
import { createTestSchema } from '../../../cards/tests/test-utils/createTestSchema';

describe('DrizzleFeedRepository', () => {
  let container: StartedPostgreSqlContainer;
  let db: PostgresJsDatabase;
  let feedRepository: DrizzleFeedRepository;

  // Test data
  let curatorId: CuratorId;
  let anotherCuratorId: CuratorId;
  let cardId: CardId;
  let anotherCardId: CardId;
  let collectionId: CollectionId;

  // Setup before all tests
  beforeAll(async () => {
    // Start PostgreSQL container
    container = await new PostgreSqlContainer('postgres:14').start();

    // Create database connection
    const connectionString = container.getConnectionUri();
    process.env.DATABASE_URL = connectionString;
    const client = postgres(connectionString);
    db = drizzle(client);

    // Create repository
    feedRepository = new DrizzleFeedRepository(db);

    // Create schema using helper function
    await createTestSchema(db);

    // Create test data
    curatorId = CuratorId.create('did:plc:testcurator').unwrap();
    anotherCuratorId = CuratorId.create('did:plc:anothercurator').unwrap();
    cardId = CardId.createFromString('card-123').unwrap();
    anotherCardId = CardId.createFromString('card-456').unwrap();
    collectionId = CollectionId.createFromString('collection-123').unwrap();
  }, 60000); // Increase timeout for container startup

  // Cleanup after all tests
  afterAll(async () => {
    // Stop container
    await container.stop();
  });

  // Clear data between tests
  beforeEach(async () => {
    await db.delete(feedActivities);
  });

  it('should add and retrieve a card collected activity', async () => {
    // Create a card collected activity
    const activityResult = FeedActivity.createCardCollected(
      curatorId,
      cardId,
      [collectionId],
    );

    expect(activityResult.isOk()).toBe(true);
    const activity = activityResult.unwrap();

    // Add the activity
    const addResult = await feedRepository.addActivity(activity);
    expect(addResult.isOk()).toBe(true);

    // Retrieve the activity by ID
    const retrievedResult = await feedRepository.findById(activity.activityId);
    expect(retrievedResult.isOk()).toBe(true);

    const retrievedActivity = retrievedResult.unwrap();
    expect(retrievedActivity).not.toBeNull();
    expect(retrievedActivity?.activityId.getStringValue()).toBe(
      activity.activityId.getStringValue(),
    );
    expect(retrievedActivity?.actorId.value).toBe(curatorId.value);
    expect(retrievedActivity?.cardCollected).toBe(true);
    expect(retrievedActivity?.metadata.cardId).toBe(cardId.getStringValue());
    expect(retrievedActivity?.metadata.collectionIds).toEqual([
      collectionId.getStringValue(),
    ]);
  });

  it('should add a card collected activity without collections', async () => {
    // Create a card collected activity without collections
    const activityResult = FeedActivity.createCardCollected(
      curatorId,
      cardId,
    );

    expect(activityResult.isOk()).toBe(true);
    const activity = activityResult.unwrap();

    // Add the activity
    const addResult = await feedRepository.addActivity(activity);
    expect(addResult.isOk()).toBe(true);

    // Retrieve the activity
    const retrievedResult = await feedRepository.findById(activity.activityId);
    const retrievedActivity = retrievedResult.unwrap();

    expect(retrievedActivity?.metadata.cardId).toBe(cardId.getStringValue());
    expect(retrievedActivity?.metadata.collectionIds).toBeUndefined();
  });

  it('should retrieve global feed with pagination', async () => {
    // Create multiple activities with different timestamps to ensure proper ordering
    const baseTime = new Date();
    const activity1 = FeedActivity.createCardCollected(
      curatorId,
      cardId,
      [collectionId],
      new Date(baseTime.getTime() - 200), // oldest
    ).unwrap();

    const activity2 = FeedActivity.createCardCollected(
      anotherCuratorId,
      anotherCardId,
      undefined,
      new Date(baseTime.getTime() - 100), // middle
    ).unwrap();

    const activity3 = FeedActivity.createCardCollected(
      curatorId,
      anotherCardId,
      [collectionId],
      new Date(baseTime.getTime()), // newest
    ).unwrap();

    // Add activities (order doesn't matter since timestamps are set)
    await feedRepository.addActivity(activity1);
    await feedRepository.addActivity(activity2);
    await feedRepository.addActivity(activity3);

    // Get first page
    const feedResult = await feedRepository.getGlobalFeed({
      page: 1,
      limit: 2,
    });

    expect(feedResult.isOk()).toBe(true);
    const feed = feedResult.unwrap();

    expect(feed.activities).toHaveLength(2);
    expect(feed.totalCount).toBe(3);
    expect(feed.hasMore).toBe(true);
    expect(feed.nextCursor).toBeDefined();

    // Activities should be ordered by creation time (newest first)
    expect(feed.activities[0]?.activityId.getStringValue()).toBe(
      activity3.activityId.getStringValue(),
    );
    expect(feed.activities[1]?.activityId.getStringValue()).toBe(
      activity2.activityId.getStringValue(),
    );

    // Get second page
    const secondPageResult = await feedRepository.getGlobalFeed({
      page: 2,
      limit: 2,
    });

    const secondPage = secondPageResult.unwrap();
    expect(secondPage.activities).toHaveLength(1);
    expect(secondPage.hasMore).toBe(false);
    expect(secondPage.activities[0]?.activityId.getStringValue()).toBe(
      activity1.activityId.getStringValue(),
    );
  });

  it('should support cursor-based pagination', async () => {
    // Create multiple activities with different timestamps
    const baseTime = new Date();
    const activity1 = FeedActivity.createCardCollected(
      curatorId,
      cardId,
      undefined,
      new Date(baseTime.getTime() - 200), // oldest
    ).unwrap();

    const activity2 = FeedActivity.createCardCollected(
      anotherCuratorId,
      anotherCardId,
      undefined,
      new Date(baseTime.getTime() - 100), // middle
    ).unwrap();

    const activity3 = FeedActivity.createCardCollected(
      curatorId,
      anotherCardId,
      undefined,
      new Date(baseTime.getTime()), // newest
    ).unwrap();

    // Add activities (order doesn't matter since timestamps are set)
    await feedRepository.addActivity(activity1);
    await feedRepository.addActivity(activity2);
    await feedRepository.addActivity(activity3);

    // Get activities before activity3 (should return activity2 and activity1)
    const feedResult = await feedRepository.getGlobalFeed({
      page: 1,
      limit: 10,
      beforeActivityId: activity3.activityId,
    });

    expect(feedResult.isOk()).toBe(true);
    const feed = feedResult.unwrap();

    expect(feed.activities).toHaveLength(2);
    expect(feed.activities[0]?.activityId.getStringValue()).toBe(
      activity2.activityId.getStringValue(),
    );
    expect(feed.activities[1]?.activityId.getStringValue()).toBe(
      activity1.activityId.getStringValue(),
    );
  });

  it('should return null when activity is not found', async () => {
    const nonExistentId = CardId.createFromString('non-existent').unwrap();
    const activityId = FeedActivity.createCardCollected(
      curatorId,
      nonExistentId,
    ).unwrap().activityId;

    const result = await feedRepository.findById(activityId);
    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toBeNull();
  });

  it('should return empty feed when no activities exist', async () => {
    const feedResult = await feedRepository.getGlobalFeed({
      page: 1,
      limit: 10,
    });

    expect(feedResult.isOk()).toBe(true);
    const feed = feedResult.unwrap();

    expect(feed.activities).toHaveLength(0);
    expect(feed.totalCount).toBe(0);
    expect(feed.hasMore).toBe(false);
    expect(feed.nextCursor).toBeUndefined();
  });

  it('should handle activities from different actors', async () => {
    // Create activities from different actors
    const activity1 = FeedActivity.createCardCollected(
      curatorId,
      cardId,
    ).unwrap();

    const activity2 = FeedActivity.createCardCollected(
      anotherCuratorId,
      anotherCardId,
    ).unwrap();

    await feedRepository.addActivity(activity1);
    await feedRepository.addActivity(activity2);

    // Get all activities
    const feedResult = await feedRepository.getGlobalFeed({
      page: 1,
      limit: 10,
    });

    const feed = feedResult.unwrap();
    expect(feed.activities).toHaveLength(2);

    const actorIds = feed.activities.map(a => a.actorId.value);
    expect(actorIds).toContain(curatorId.value);
    expect(actorIds).toContain(anotherCuratorId.value);
  });

  it('should preserve activity metadata correctly', async () => {
    const multipleCollections = [
      collectionId,
      CollectionId.createFromString('collection-456').unwrap(),
    ];

    const activity = FeedActivity.createCardCollected(
      curatorId,
      cardId,
      multipleCollections,
    ).unwrap();

    await feedRepository.addActivity(activity);

    const retrievedResult = await feedRepository.findById(activity.activityId);
    const retrievedActivity = retrievedResult.unwrap();

    expect(retrievedActivity?.metadata.cardId).toBe(cardId.getStringValue());
    expect(retrievedActivity?.metadata.collectionIds).toEqual([
      collectionId.getStringValue(),
      'collection-456',
    ]);
  });
});
