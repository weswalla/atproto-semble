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
import { cards } from "../../infrastructure/repositories/schema/card.sql";
import { libraryMemberships } from "../../infrastructure/repositories/schema/libraryMembership.sql";
import { CardFactory } from "../../domain/CardFactory";
import { CardTypeEnum } from "../../domain/value-objects/CardType";
import { UrlMetadata } from "../../domain/value-objects/UrlMetadata";
import { CardContent } from "../../domain/value-objects/CardContent";

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
      CREATE TABLE IF NOT EXISTS cards (
        id UUID PRIMARY KEY,
        curator_id TEXT NOT NULL,
        type TEXT NOT NULL,
        content_data JSONB NOT NULL,
        url TEXT,
        parent_card_id UUID REFERENCES cards(id),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS library_memberships (
        card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        published_record_id UUID,
        PRIMARY KEY (card_id, user_id)
      );

      CREATE INDEX idx_user_cards ON library_memberships(user_id);
      CREATE INDEX idx_card_users ON library_memberships(card_id);
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
    await db.execute(sql`DELETE FROM library_memberships`);
    await db.delete(cards);
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

    const cardResult = CardFactory.create({
      curatorId: curatorId.value,
      cardInput: {
        type: CardTypeEnum.URL,
        url: url.value,
        metadata,
      },
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
    const cardResult = CardFactory.create({
      curatorId: curatorId.value,
      cardInput: {
        type: CardTypeEnum.NOTE,
        text: "This is a test note",
        title: "Test Note",
      },
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
    expect(retrievedCard?.content.noteContent?.title).toBe("Test Note");
  });

  it("should save and retrieve a card with library memberships", async () => {
    // Create a note card
    const cardResult = CardFactory.create({
      curatorId: curatorId.value,
      cardInput: {
        type: CardTypeEnum.NOTE,
        text: "Card with library memberships",
        title: "Library Test Card",
      },
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
    const cardResult = CardFactory.create({
      curatorId: curatorId.value,
      cardInput: {
        type: CardTypeEnum.NOTE,
        text: "Card for membership updates",
        title: "Membership Test Card",
      },
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
    expect(retrievedCard?.libraryMemberships[0].curatorId.value).toBe(
      anotherCuratorId.value
    );
  });

  it("should delete a card and its library memberships", async () => {
    // Create a card
    const cardResult = CardFactory.create({
      curatorId: curatorId.value,
      cardInput: {
        type: CardTypeEnum.NOTE,
        text: "Card to delete",
      },
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
    const nonExistentCardId = CardFactory.create({
      curatorId: curatorId.value,
      cardInput: {
        type: CardTypeEnum.NOTE,
        text: "Non-existent card",
      },
    }).unwrap().cardId;

    const result = await cardRepository.findById(nonExistentCardId);
    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toBeNull();
  });
});
