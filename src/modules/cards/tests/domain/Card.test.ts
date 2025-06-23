import { Card, CardValidationError } from "../../domain/Card";
import { CardType, CardTypeEnum } from "../../domain/value-objects/CardType";
import { CardContent } from "../../domain/value-objects/CardContent";
import { CardId } from "../../domain/value-objects/CardId";
import { CuratorId } from "../../../annotations/domain/value-objects/CuratorId";
import { URL } from "../../domain/value-objects/URL";
import { UniqueEntityID } from "../../../../shared/domain/UniqueEntityID";
import { Err } from "../../../../shared/core/Result";

describe("Card", () => {
  const validCuratorId = CuratorId.create("did:plc:test123").unwrap();
  const validUrl = URL.create("https://example.com").unwrap();

  describe("URL Card", () => {
    it("should create a valid URL card", () => {
      const cardType = CardType.create(CardTypeEnum.URL).unwrap();
      const cardContent = CardContent.createUrlContent(validUrl).unwrap();

      const result = Card.create({
        curatorId: validCuratorId,
        type: cardType,
        content: cardContent,
      });

      expect(result.isOk()).toBe(true);
      const card = result.unwrap();
      expect(card.isUrlCard).toBe(true);
      expect(card.isNoteCard).toBe(false);
      expect(card.isHighlightCard).toBe(false);
      expect(card.curatorId).toBe(validCuratorId);
      expect(card.type.value).toBe(CardTypeEnum.URL);
      expect(card.parentCardId).toBeUndefined();
      expect(card.url).toBeUndefined();
    });

    it("should create a URL card with optional url field", () => {
      const cardType = CardType.create(CardTypeEnum.URL).unwrap();
      const cardContent = CardContent.createUrlContent(validUrl).unwrap();
      const cardUrl = URL.create("https://example.org").unwrap();

      const result = Card.create({
        curatorId: validCuratorId,
        type: cardType,
        content: cardContent,
        url: cardUrl,
      });

      expect(result.isOk()).toBe(true);
      const card = result.unwrap();
      expect(card.isUrlCard).toBe(true);
      expect(card.url).toBe(cardUrl);
      expect(card.url?.value).toBe("https://example.org");
    });

    it("should reject URL card with parent card", () => {
      const cardType = CardType.create(CardTypeEnum.URL).unwrap();
      const cardContent = CardContent.createUrlContent(validUrl).unwrap();
      const parentCardId = CardId.create(new UniqueEntityID()).unwrap();

      const result = Card.create({
        curatorId: validCuratorId,
        type: cardType,
        content: cardContent,
        parentCardId,
      });

      expect(result.isErr()).toBe(true);
      expect((result as Err<Card, CardValidationError>).error).toBeInstanceOf(CardValidationError);
      expect((result as Err<Card, CardValidationError>).error.message).toBe("URL cards cannot have parent cards");
    });

    it("should reject URL card with mismatched content type", () => {
      const cardType = CardType.create(CardTypeEnum.URL).unwrap();
      const cardContent = CardContent.createNoteContent("Test note").unwrap();

      const result = Card.create({
        curatorId: validCuratorId,
        type: cardType,
        content: cardContent,
      });

      expect(result.isErr()).toBe(true);
      expect((result as Err<Card, CardValidationError>).error).toBeInstanceOf(CardValidationError);
      expect((result as Err<Card, CardValidationError>).error.message).toBe("Card type must match content type");
    });
  });

  describe("Note Card", () => {
    it("should create a standalone note card", () => {
      const cardType = CardType.create(CardTypeEnum.NOTE).unwrap();
      const cardContent = CardContent.createNoteContent("Test note", "Test Title").unwrap();

      const result = Card.create({
        curatorId: validCuratorId,
        type: cardType,
        content: cardContent,
      });

      expect(result.isOk()).toBe(true);
      const card = result.unwrap();
      expect(card.isNoteCard).toBe(true);
      expect(card.isStandaloneNote).toBe(true);
      expect(card.isLinkedNote).toBe(false);
      expect(card.parentCardId).toBeUndefined();
      expect(card.url).toBeUndefined();
    });

    it("should create a note card with optional url field", () => {
      const cardType = CardType.create(CardTypeEnum.NOTE).unwrap();
      const cardContent = CardContent.createNoteContent("Test note about a URL").unwrap();
      const noteUrl = URL.create("https://reference.example.com").unwrap();

      const result = Card.create({
        curatorId: validCuratorId,
        type: cardType,
        content: cardContent,
        url: noteUrl,
      });

      expect(result.isOk()).toBe(true);
      const card = result.unwrap();
      expect(card.isNoteCard).toBe(true);
      expect(card.url).toBe(noteUrl);
      expect(card.url?.value).toBe("https://reference.example.com");
    });

    it("should create a linked note card", () => {
      const cardType = CardType.create(CardTypeEnum.NOTE).unwrap();
      const cardContent = CardContent.createNoteContent("Test note").unwrap();
      const parentCardId = CardId.create(new UniqueEntityID()).unwrap();

      const result = Card.create({
        curatorId: validCuratorId,
        type: cardType,
        content: cardContent,
        parentCardId,
      });

      expect(result.isOk()).toBe(true);
      const card = result.unwrap();
      expect(card.isNoteCard).toBe(true);
      expect(card.isStandaloneNote).toBe(false);
      expect(card.isLinkedNote).toBe(true);
      expect(card.parentCardId).toBe(parentCardId);
    });

    it("should update note content", () => {
      const cardType = CardType.create(CardTypeEnum.NOTE).unwrap();
      const cardContent = CardContent.createNoteContent("Original note").unwrap();
      const card = Card.create({
        curatorId: validCuratorId,
        type: cardType,
        content: cardContent,
      }).unwrap();

      const newContent = CardContent.createNoteContent("Updated note").unwrap();
      const updateResult = card.updateContent(newContent);

      expect(updateResult.isOk()).toBe(true);
      expect(card.content.noteContent?.text).toBe("Updated note");
    });

    it("should reject content update with different type", () => {
      const cardType = CardType.create(CardTypeEnum.NOTE).unwrap();
      const cardContent = CardContent.createNoteContent("Test note").unwrap();
      const card = Card.create({
        curatorId: validCuratorId,
        type: cardType,
        content: cardContent,
      }).unwrap();

      const urlContent = CardContent.createUrlContent(validUrl).unwrap();
      const updateResult = card.updateContent(urlContent);

      expect(updateResult.isErr()).toBe(true);
      expect((updateResult as Err<void, CardValidationError>).error.message).toBe("Cannot change card content to different type");
    });
  });

  describe("Highlight Card", () => {
    it("should create a highlight card with parent", () => {
      const cardType = CardType.create(CardTypeEnum.HIGHLIGHT).unwrap();
      const cardContent = CardContent.createHighlightContent(
        "highlighted text",
        [{ type: "TextQuoteSelector", exact: "highlighted text" }]
      ).unwrap();
      const parentCardId = CardId.create(new UniqueEntityID()).unwrap();

      const result = Card.create({
        curatorId: validCuratorId,
        type: cardType,
        content: cardContent,
        parentCardId,
      });

      expect(result.isOk()).toBe(true);
      const card = result.unwrap();
      expect(card.isHighlightCard).toBe(true);
      expect(card.parentCardId).toBe(parentCardId);
      expect(card.url).toBeUndefined();
    });

    it("should create a highlight card with optional url field", () => {
      const cardType = CardType.create(CardTypeEnum.HIGHLIGHT).unwrap();
      const cardContent = CardContent.createHighlightContent(
        "highlighted text from article",
        [{ type: "TextQuoteSelector", exact: "highlighted text from article" }]
      ).unwrap();
      const parentCardId = CardId.create(new UniqueEntityID()).unwrap();
      const highlightUrl = URL.create("https://article.example.com").unwrap();

      const result = Card.create({
        curatorId: validCuratorId,
        type: cardType,
        content: cardContent,
        parentCardId,
        url: highlightUrl,
      });

      expect(result.isOk()).toBe(true);
      const card = result.unwrap();
      expect(card.isHighlightCard).toBe(true);
      expect(card.parentCardId).toBe(parentCardId);
      expect(card.url).toBe(highlightUrl);
      expect(card.url?.value).toBe("https://article.example.com");
    });

    it("should reject highlight card without parent", () => {
      const cardType = CardType.create(CardTypeEnum.HIGHLIGHT).unwrap();
      const cardContent = CardContent.createHighlightContent(
        "highlighted text",
        [{ type: "TextQuoteSelector", exact: "highlighted text" }]
      ).unwrap();

      const result = Card.create({
        curatorId: validCuratorId,
        type: cardType,
        content: cardContent,
      });

      expect(result.isErr()).toBe(true);
      expect((result as Err<Card, CardValidationError>).error).toBeInstanceOf(CardValidationError);
      expect((result as Err<Card, CardValidationError>).error.message).toBe("Highlight cards must have a parent card");
    });
  });

  describe("Card properties", () => {
    it("should set creation and update timestamps", () => {
      const cardType = CardType.create(CardTypeEnum.NOTE).unwrap();
      const cardContent = CardContent.createNoteContent("Test note").unwrap();
      const beforeCreate = new Date();

      const card = Card.create({
        curatorId: validCuratorId,
        type: cardType,
        content: cardContent,
      }).unwrap();

      const afterCreate = new Date();

      expect(card.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(card.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
      expect(card.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(card.updatedAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it("should update timestamp when content is updated", () => {
      const cardType = CardType.create(CardTypeEnum.NOTE).unwrap();
      const cardContent = CardContent.createNoteContent("Original note").unwrap();
      const card = Card.create({
        curatorId: validCuratorId,
        type: cardType,
        content: cardContent,
      }).unwrap();

      const originalUpdatedAt = card.updatedAt;
      
      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        const newContent = CardContent.createNoteContent("Updated note").unwrap();
        card.updateContent(newContent);
        
        expect(card.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 10);
    });

    it("should generate unique card IDs", () => {
      const cardType = CardType.create(CardTypeEnum.NOTE).unwrap();
      const cardContent = CardContent.createNoteContent("Test note").unwrap();

      const card1 = Card.create({
        curatorId: validCuratorId,
        type: cardType,
        content: cardContent,
      }).unwrap();

      const card2 = Card.create({
        curatorId: validCuratorId,
        type: cardType,
        content: cardContent,
      }).unwrap();

      expect(card1.cardId.getStringValue()).not.toBe(card2.cardId.getStringValue());
    });
  });
});
