import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import postgres from "postgres";
import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { DrizzleCardRepository } from "../../infrastructure/repositories/DrizzleCardRepository";
import { CuratorId } from "../../../annotations/domain/value-objects/CuratorId";
import { URL } from "../../domain/value-objects/URL";
import { PublishedRecordId } from "../../domain/value-objects/PublishedRecordId";
import { sql } from "drizzle-orm";
import { cards } from "../../infrastructure/repositories/schema/card.sql";
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
      CREATE TABLE IF NOT EXISTS published_records (
        id UUID PRIMARY KEY,
        uri TEXT NOT NULL,
        cid TEXT NOT NULL,
        recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        UNIQUE(uri, cid)
      );

      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        curator_id TEXT NOT NULL,
        type TEXT NOT NULL,
        content_data JSONB NOT NULL,
        parent_card_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        published_record_id UUID REFERENCES published_records(id)
      );
    `);

    // Create test data
    curatorId = CuratorId.create("did:plc:testcurator").unwrap();
  }, 60000); // Increase timeout for container startup

  // Cleanup after all tests
  afterAll(async () => {
    // Stop container
    await container.stop();
  });

  // Clear data between tests
  beforeEach(async () => {
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
    expect(retrievedCard?.curatorId.value).toBe(curatorId.value);
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

  it("should save and retrieve a highlight card", async () => {
    // Create a parent card first for the highlight
    const parentCardResult = CardFactory.create({
      curatorId: curatorId.value,
      cardInput: {
        type: CardTypeEnum.NOTE,
        text: "Parent document",
        title: "Test Document",
      },
    });
    const parentCard = parentCardResult.unwrap();
    await cardRepository.save(parentCard);

    // Create a highlight card
    const cardResult = CardFactory.create({
      curatorId: curatorId.value,
      cardInput: {
        type: CardTypeEnum.HIGHLIGHT,
        text: "This is highlighted text",
        selectors: [
          {
            type: "TextQuoteSelector" as const,
            exact: "This is highlighted text",
            prefix: "Before ",
            suffix: " after",
          },
        ],
        parentCardId: parentCard.cardId.getStringValue(),
        context: "Before This is highlighted text after",
        documentUrl: "https://example.com/document",
        documentTitle: "Test Document",
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
    expect(retrievedCard?.content.type).toBe(CardTypeEnum.HIGHLIGHT);
    expect(retrievedCard?.content.highlightContent?.text).toBe(
      "This is highlighted text"
    );
    expect(retrievedCard?.content.highlightContent?.selectors).toHaveLength(1);
    expect(retrievedCard?.content.highlightContent?.context).toBe(
      "Before This is highlighted text after"
    );
  });

  it("should update an existing card", async () => {
    // Create a note card
    const cardResult = CardFactory.create({
      curatorId: curatorId.value,
      cardInput: {
        type: CardTypeEnum.NOTE,
        text: "Original text",
        title: "Original Title",
      },
    });

    const card = cardResult.unwrap();
    await cardRepository.save(card);

    // Update the card by modifying its content directly
    const updatedContent = CardContent.createNoteContent(
      "Updated text",
      "Updated Title"
    );
    if (updatedContent.isOk()) {
      card.updateContent(updatedContent.value);
    }

    await cardRepository.save(card);

    // Retrieve the updated card
    const retrievedResult = await cardRepository.findById(card.cardId);
    const retrievedCard = retrievedResult.unwrap();

    expect(retrievedCard).not.toBeNull();
    expect(retrievedCard?.content.noteContent?.text).toBe("Updated text");
    expect(retrievedCard?.content.noteContent?.title).toBe("Updated Title");
  });

  it("should delete a card", async () => {
    // Create a card
    const cardResult = CardFactory.create({
      curatorId: curatorId.value,
      cardInput: {
        type: CardTypeEnum.NOTE,
        text: "Card to delete",
      },
    });

    const card = cardResult.unwrap();
    await cardRepository.save(card);

    // Delete the card
    const deleteResult = await cardRepository.delete(card.cardId);
    expect(deleteResult.isOk()).toBe(true);

    // Try to retrieve the deleted card
    const retrievedResult = await cardRepository.findById(card.cardId);
    expect(retrievedResult.isOk()).toBe(true);
    expect(retrievedResult.unwrap()).toBeNull();
  });

  it("should find cards by curator ID", async () => {
    // Create multiple cards for the same curator
    const card1Result = CardFactory.create({
      curatorId: curatorId.value,
      cardInput: {
        type: CardTypeEnum.NOTE,
        text: "First card",
      },
    });

    const card2Result = CardFactory.create({
      curatorId: curatorId.value,
      cardInput: {
        type: CardTypeEnum.NOTE,
        text: "Second card",
      },
    });

    const card1 = card1Result.unwrap();
    const card2 = card2Result.unwrap();

    await cardRepository.save(card1);
    await cardRepository.save(card2);

    // Find cards by curator ID
    const foundCardsResult = await cardRepository.findByCuratorId(curatorId);
    expect(foundCardsResult.isOk()).toBe(true);

    const foundCards = foundCardsResult.unwrap();
    expect(foundCards).toHaveLength(2);

    const texts = foundCards.map((c) => c.content.noteContent?.text);
    expect(texts).toContain("First card");
    expect(texts).toContain("Second card");
  });

  it("should find card by URL", async () => {
    const url = URL.create("https://example.com/unique-article").unwrap();

    const metadata = UrlMetadata.create({
      url: url.value,
      title: "Unique Article",
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

    const card = cardResult.unwrap();
    await cardRepository.save(card);

    // Find card by URL
    const foundCardResult = await cardRepository.findByUrl(url);
    expect(foundCardResult.isOk()).toBe(true);

    const foundCard = foundCardResult.unwrap();
    expect(foundCard).not.toBeNull();
    expect(foundCard?.cardId.getStringValue()).toBe(
      card.cardId.getStringValue()
    );
    expect(foundCard?.content.urlContent?.url.value).toBe(url.value);
  });

  it("should find cards by parent card ID", async () => {
    // Create a parent card
    const parentCardResult = CardFactory.create({
      curatorId: curatorId.value,
      cardInput: {
        type: CardTypeEnum.NOTE,
        text: "Parent card",
      },
    });

    const parentCard = parentCardResult.unwrap();
    await cardRepository.save(parentCard);

    // Create child cards
    const child1Result = CardFactory.create({
      curatorId: curatorId.value,
      cardInput: {
        type: CardTypeEnum.NOTE,
        text: "Child card 1",
        parentCardId: parentCard.cardId.getStringValue(),
      },
    });

    const child2Result = CardFactory.create({
      curatorId: curatorId.value,
      cardInput: {
        type: CardTypeEnum.NOTE,
        text: "Child card 2",
        parentCardId: parentCard.cardId.getStringValue(),
      },
    });

    const child1 = child1Result.unwrap();
    const child2 = child2Result.unwrap();

    await cardRepository.save(child1);
    await cardRepository.save(child2);

    // Find child cards
    const childCardsResult = await cardRepository.findByParentCardId(
      parentCard.cardId
    );
    expect(childCardsResult.isOk()).toBe(true);

    const childCards = childCardsResult.unwrap();
    expect(childCards).toHaveLength(2);

    const texts = childCards.map((c) => c.content.noteContent?.text);
    expect(texts).toContain("Child card 1");
    expect(texts).toContain("Child card 2");
  });

  it("should save and retrieve a card with published record", async () => {
    // Create a card
    const cardResult = CardFactory.create({
      curatorId: curatorId.value,
      cardInput: {
        type: CardTypeEnum.NOTE,
        text: "Published card",
      },
    });

    const card = cardResult.unwrap();

    // Mark as published
    const publishedRecordId = PublishedRecordId.create({
      uri: "at://did:plc:testcurator/app.cards.card/1234",
      cid: "bafyreihgmyh2srmmyj7g7vmah3ietpwdwcgda2jof7hkfxmcbbjwejnqwu",
    });

    card.markAsPublished(publishedRecordId);

    // Save the card
    const saveResult = await cardRepository.save(card);
    expect(saveResult.isOk()).toBe(true);

    // Retrieve the card
    const retrievedResult = await cardRepository.findById(card.cardId);
    expect(retrievedResult.isOk()).toBe(true);

    const retrievedCard = retrievedResult.unwrap();
    expect(retrievedCard).not.toBeNull();
    expect(retrievedCard?.publishedRecordId?.uri).toBe(
      "at://did:plc:testcurator/app.cards.card/1234"
    );
    expect(retrievedCard?.publishedRecordId?.cid).toBe(
      "bafyreihgmyh2srmmyj7g7vmah3ietpwdwcgda2jof7hkfxmcbbjwejnqwu"
    );
  });
});
