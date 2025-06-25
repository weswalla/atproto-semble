import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import postgres from "postgres";
import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { DrizzleCardRepository } from "../../infrastructure/repositories/DrizzleCardRepository";
import { CuratorId } from "../../../annotations/domain/value-objects/CuratorId";
import { URL } from "../../domain/value-objects/URL";
import { sql } from "drizzle-orm";
import { Card } from "../../domain/Card";
import { CardType, CardTypeEnum } from "../../domain/value-objects/CardType";
import { UrlMetadata } from "../../domain/value-objects/UrlMetadata";
import { CardContent } from "../../domain/value-objects/CardContent";
import { PublishedRecordId } from "../../domain/value-objects/PublishedRecordId";

describe("DrizzleCardRepository", () => {
  let container: StartedPostgreSqlContainer;
  let db: PostgresJsDatabase;
  let cardRepository: DrizzleCardRepository;

  // Test data
  let curatorId: CuratorId;
  let anotherCuratorId: CuratorId;

  // Setup before all tests
  beforeAll(async () => {
    // Start PostgreSQL container
    container = await new PostgreSqlContainer().start();

    // Create database connection
    const connectionString = container.getConnectionUri();
    process.env.DATABASE_URL = connectionString;
    const client = postgres(connectionString);
    db = drizzle(client);

    // Create repository
    cardRepository = new DrizzleCardRepository(db);

    // Create schema using drizzle schema definitions
    await db.execute(sql`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      CREATE TABLE IF NOT EXISTS published_records (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        uri TEXT NOT NULL,
        cid TEXT NOT NULL,
        recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        CONSTRAINT uri_cid_unique UNIQUE (uri, cid)
      );

      CREATE TABLE IF NOT EXISTS cards (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        type TEXT NOT NULL,
        content_data JSONB NOT NULL,
        url TEXT,
        parent_card_id UUID REFERENCES cards(id),
        original_published_record_id UUID REFERENCES published_records(id),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS library_memberships (
        card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        published_record_id UUID REFERENCES published_records(id),
        PRIMARY KEY (card_id, user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_user_cards ON library_memberships(user_id);
      CREATE INDEX IF NOT EXISTS idx_card_users ON library_memberships(card_id);
    `);

    // Create test data
    curatorId = CuratorId.create("did:plc:testcurator").unwrap();
    anotherCuratorId = CuratorId.create("did:plc:anothercurator").unwrap();
  }, 60000); // Increase timeout for container startup

  // Cleanup after all tests
  afterAll(async () => {
    // Stop container
    await container.stop();
  });

  // Clear data between tests
  beforeEach(async () => {
    await db.execute(sql`TRUNCATE TABLE library_memberships CASCADE`);
    await db.execute(sql`TRUNCATE TABLE cards CASCADE`);
    await db.execute(sql`TRUNCATE TABLE published_records CASCADE`);
  });

  it("should save and retrieve a URL card", async () => {
    // Create a URL card
    const url = URL.create("https://example.com/article1").unwrap();
    const metadata = UrlMetadata.create({
      url: "https://example.com/article1",
      title: "Test Article",
      description: "A test article",
      author: "Test Author",
      siteName: "Example Site",
      retrievedAt: new Date(),
    }).unwrap();

    const urlContent = CardContent.createUrlContent(url, metadata).unwrap();
    const cardType = CardType.create(CardTypeEnum.URL).unwrap();

    const cardResult = Card.create({
      type: cardType,
      content: urlContent,
      url,
    });

    expect(cardResult.isOk()).toBe(true);
    const card = cardResult.unwrap();

    // Save the card
    const saveResult = await cardRepository.save(card);
    expect(saveResult.isOk()).toBe(true);

    // Retrieve the card
    const retrievedResult = await cardRepository.findById(card.cardId);
    expect(retrievedResult.isOk()).toBe(true);

    const retrievedCard = retrievedResult.unwrap();
    expect(retrievedCard).not.toBeNull();
    expect(retrievedCard?.cardId.getStringValue()).toBe(
      card.cardId.getStringValue()
    );
    expect(retrievedCard?.content.type).toBe(CardTypeEnum.URL);
    expect(retrievedCard?.content.urlContent?.url.value).toBe(url.value);
    expect(retrievedCard?.content.urlContent?.metadata?.title).toBe(
      "Test Article"
    );
  });

  it("should save and retrieve a note card", async () => {
    // Create a note card
    const noteContent = CardContent.createNoteContent(
      "This is a test note"
    ).unwrap();
    const cardType = CardType.create(CardTypeEnum.NOTE).unwrap();

    const cardResult = Card.create({
      type: cardType,
      content: noteContent,
    });

    expect(cardResult.isOk()).toBe(true);
    const card = cardResult.unwrap();

    // Save the card
    const saveResult = await cardRepository.save(card);
    expect(saveResult.isOk()).toBe(true);

    // Retrieve the card
    const retrievedResult = await cardRepository.findById(card.cardId);
    expect(retrievedResult.isOk()).toBe(true);

    const retrievedCard = retrievedResult.unwrap();
    expect(retrievedCard).not.toBeNull();
    expect(retrievedCard?.content.type).toBe(CardTypeEnum.NOTE);
    expect(retrievedCard?.content.noteContent?.text).toBe(
      "This is a test note"
    );
    expect(retrievedCard?.content.noteContent?.title).toBeUndefined();
  });

  it("should save and retrieve a card with library memberships", async () => {
    // Create a note card
    const noteContent = CardContent.createNoteContent(
      "Card with library memberships"
    ).unwrap();
    const cardType = CardType.create(CardTypeEnum.NOTE).unwrap();

    const cardResult = Card.create({
      type: cardType,
      content: noteContent,
    });

    expect(cardResult.isOk()).toBe(true);
    const card = cardResult.unwrap();

    // Add the card to two different libraries
    const addResult1 = card.addToLibrary(curatorId);
    expect(addResult1.isOk()).toBe(true);

    const addResult2 = card.addToLibrary(anotherCuratorId);
    expect(addResult2.isOk()).toBe(true);

    // Save the card
    const saveResult = await cardRepository.save(card);
    expect(saveResult.isOk()).toBe(true);

    // Retrieve the card
    const retrievedResult = await cardRepository.findById(card.cardId);
    expect(retrievedResult.isOk()).toBe(true);

    const retrievedCard = retrievedResult.unwrap();
    expect(retrievedCard).not.toBeNull();
    expect(retrievedCard?.libraryMemberships).toHaveLength(2);

    const membershipUserIds = retrievedCard?.libraryMemberships.map(
      (m) => m.curatorId.value
    );
    expect(membershipUserIds).toContain(curatorId.value);
    expect(membershipUserIds).toContain(anotherCuratorId.value);
  });

  it("should update library memberships when card is saved", async () => {
    // Create a note card
    const noteContent = CardContent.createNoteContent(
      "Card for membership updates"
    ).unwrap();
    const cardType = CardType.create(CardTypeEnum.NOTE).unwrap();

    const cardResult = Card.create({
      type: cardType,
      content: noteContent,
    });

    const card = cardResult.unwrap();

    // Add to one library and save
    card.addToLibrary(curatorId);
    await cardRepository.save(card);

    // Verify one membership
    let retrievedResult = await cardRepository.findById(card.cardId);
    let retrievedCard = retrievedResult.unwrap();
    expect(retrievedCard?.libraryMemberships).toHaveLength(1);

    // Add to another library and save
    card.addToLibrary(anotherCuratorId);
    await cardRepository.save(card);

    // Verify two memberships
    retrievedResult = await cardRepository.findById(card.cardId);
    retrievedCard = retrievedResult.unwrap();
    expect(retrievedCard?.libraryMemberships).toHaveLength(2);

    // Remove from one library and save
    card.removeFromLibrary(curatorId);
    await cardRepository.save(card);

    // Verify one membership remains
    retrievedResult = await cardRepository.findById(card.cardId);
    retrievedCard = retrievedResult.unwrap();
    expect(retrievedCard?.libraryMemberships).toHaveLength(1);
    expect(retrievedCard?.libraryMemberships[0]!.curatorId.value).toBe(
      anotherCuratorId.value
    );
  });

  it("should delete a card and its library memberships", async () => {
    // Create a card
    const noteContent =
      CardContent.createNoteContent("Card to delete").unwrap();
    const cardType = CardType.create(CardTypeEnum.NOTE).unwrap();

    const cardResult = Card.create({
      type: cardType,
      content: noteContent,
    });

    const card = cardResult.unwrap();

    // Add to libraries
    card.addToLibrary(curatorId);
    card.addToLibrary(anotherCuratorId);

    await cardRepository.save(card);

    // Verify card and memberships exist
    let retrievedResult = await cardRepository.findById(card.cardId);
    expect(retrievedResult.unwrap()?.libraryMemberships).toHaveLength(2);

    // Delete the card
    const deleteResult = await cardRepository.delete(card.cardId);
    expect(deleteResult.isOk()).toBe(true);

    // Try to retrieve the deleted card
    retrievedResult = await cardRepository.findById(card.cardId);
    expect(retrievedResult.isOk()).toBe(true);
    expect(retrievedResult.unwrap()).toBeNull();
  });

  it("should return null when card is not found", async () => {
    const noteContent =
      CardContent.createNoteContent("Non-existent card").unwrap();
    const cardType = CardType.create(CardTypeEnum.NOTE).unwrap();

    const nonExistentCardId = Card.create({
      type: cardType,
      content: noteContent,
    }).unwrap().cardId;

    const result = await cardRepository.findById(nonExistentCardId);
    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toBeNull();
  });

  it("should handle originalPublishedRecordId when marking card as published", async () => {
    // Create a note card
    const noteContent = CardContent.createNoteContent(
      "Card for publishing test"
    ).unwrap();
    const cardType = CardType.create(CardTypeEnum.NOTE).unwrap();

    const cardResult = Card.create({
      type: cardType,
      content: noteContent,
    });

    const card = cardResult.unwrap();

    // Add to library
    card.addToLibrary(curatorId);

    // Mark as published - this should set the originalPublishedRecordId
    const publishedRecordId = {
      uri: "at://did:plc:testcurator/network.cosmik.card/test123",
      cid: "bafytest123",
    };

    const publishedRecord = PublishedRecordId.create(publishedRecordId);

    const markResult = card.markCardInLibraryAsPublished(
      curatorId,
      publishedRecord
    );
    expect(markResult.isOk()).toBe(true);

    // Verify originalPublishedRecordId is set in memory
    expect(card.originalPublishedRecordId).toBeDefined();
    expect(card.originalPublishedRecordId?.uri).toBe(publishedRecordId.uri);
    expect(card.originalPublishedRecordId?.cid).toBe(publishedRecordId.cid);

    // Save the card - this should persist the originalPublishedRecordId
    const saveResult = await cardRepository.save(card);
    expect(saveResult.isOk()).toBe(true);

    // Retrieve and verify the originalPublishedRecordId persisted
    const retrievedResult = await cardRepository.findById(card.cardId);
    const retrievedCard = retrievedResult.unwrap();

    expect(retrievedCard?.originalPublishedRecordId).toBeDefined();
    expect(retrievedCard?.originalPublishedRecordId?.uri).toBe(
      publishedRecordId.uri
    );
    expect(retrievedCard?.originalPublishedRecordId?.cid).toBe(
      publishedRecordId.cid
    );
  });
});
