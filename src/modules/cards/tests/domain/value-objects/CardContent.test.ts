import { Err } from "src/shared/core/Result";
import {
  CardContent,
  CardContentValidationError,
} from "../../../domain/value-objects/CardContent";
import { CardTypeEnum } from "../../../domain/value-objects/CardType";
import { URL } from "../../../domain/value-objects/URL";

describe("CardContent", () => {
  const validUrl = URL.create("https://example.com").unwrap();

  describe("URL content", () => {
    it("should create URL content", () => {
      const result = CardContent.createUrlContent(validUrl);

      expect(result.isOk()).toBe(true);
      const content = result.unwrap();
      expect(content.type).toBe(CardTypeEnum.URL);
      expect(content.urlContent).toBeTruthy();
      expect(content.noteContent).toBeNull();
      expect(content.highlightContent).toBeNull();
    });

    it("should create URL content with metadata", () => {
      // Note: This would require UrlMetadata to be implemented
      const result = CardContent.createUrlContent(validUrl);

      expect(result.isOk()).toBe(true);
      const content = result.unwrap();
      expect(content.urlContent?.url).toBe(validUrl);
    });
  });

  describe("Note content", () => {
    it("should create note content", () => {
      const result = CardContent.createNoteContent("Test note");

      expect(result.isOk()).toBe(true);
      const content = result.unwrap();
      expect(content.type).toBe(CardTypeEnum.NOTE);
      expect(content.noteContent).toBeTruthy();
      expect(content.urlContent).toBeNull();
      expect(content.highlightContent).toBeNull();
      expect(content.noteContent?.text).toBe("Test note");
    });

    it("should create note content with title", () => {
      const result = CardContent.createNoteContent("Test note", "Test Title");

      expect(result.isOk()).toBe(true);
      const content = result.unwrap();
      expect(content.noteContent?.text).toBe("Test note");
      expect(content.noteContent?.title).toBe("Test Title");
    });

    it("should propagate note validation errors", () => {
      const result = CardContent.createNoteContent("");

      expect(result.isErr()).toBe(true);
      expect(
        (result as Err<CardContent, CardContentValidationError>).error
      ).toBeInstanceOf(CardContentValidationError);
      expect(
        (result as Err<CardContent, CardContentValidationError>).error.message
      ).toBe("Note text cannot be empty");
    });
  });

  describe("Highlight content", () => {
    it("should create highlight content", () => {
      const selectors = [
        { type: "TextQuoteSelector" as const, exact: "highlighted text" },
      ];
      const result = CardContent.createHighlightContent(
        "highlighted text",
        selectors
      );

      expect(result.isOk()).toBe(true);
      const content = result.unwrap();
      expect(content.type).toBe(CardTypeEnum.HIGHLIGHT);
      expect(content.highlightContent).toBeTruthy();
      expect(content.urlContent).toBeNull();
      expect(content.noteContent).toBeNull();
      expect(content.highlightContent?.text).toBe("highlighted text");
    });

    it("should create highlight content with options", () => {
      const selectors = [
        { type: "TextQuoteSelector" as const, exact: "highlighted text" },
      ];
      const result = CardContent.createHighlightContent(
        "highlighted text",
        selectors,
        {
          context: "some context",
          documentUrl: "https://example.com",
          documentTitle: "Example",
        }
      );

      expect(result.isOk()).toBe(true);
      const content = result.unwrap();
      expect(content.highlightContent?.context).toBe("some context");
      expect(content.highlightContent?.documentUrl).toBe("https://example.com");
      expect(content.highlightContent?.documentTitle).toBe("Example");
    });

    it("should propagate highlight validation errors", () => {
      const result = CardContent.createHighlightContent("", []);

      expect(result.isErr()).toBe(true);
      expect(
        (result as Err<CardContent, CardContentValidationError>).error
      ).toBeInstanceOf(CardContentValidationError);
    });
  });

  describe("Hypothes.is-style highlight creation", () => {
    it("should create highlight with Hypothes.is selectors", () => {
      const result = CardContent.createHighlightWithHypothesisSelectors(
        "highlighted text",
        "highlighted text",
        "some ",
        " here",
        100,
        116
      );

      expect(result.isOk()).toBe(true);
      const content = result.unwrap();
      expect(content.type).toBe(CardTypeEnum.HIGHLIGHT);
      expect(content.highlightContent?.selectors).toHaveLength(2);
    });

    it("should create highlight with range selector", () => {
      const result = CardContent.createHighlightWithHypothesisSelectors(
        "highlighted text",
        "highlighted text",
        "some ",
        " here",
        100,
        116,
        {
          rangeSelector: {
            startContainer: "/html/body/p[1]",
            startOffset: 5,
            endContainer: "/html/body/p[1]",
            endOffset: 21,
          },
        }
      );

      expect(result.isOk()).toBe(true);
      const content = result.unwrap();
      expect(content.highlightContent?.selectors).toHaveLength(3);
    });
  });

  describe("highlight helper methods", () => {
    it("should get TextQuoteSelector from highlight content", () => {
      const selectors = [
        {
          type: "TextQuoteSelector" as const,
          exact: "highlighted text",
          prefix: "some ",
          suffix: " here",
        },
        { type: "TextPositionSelector" as const, start: 100, end: 116 },
      ];
      const content = CardContent.createHighlightContent(
        "highlighted text",
        selectors
      ).unwrap();

      const textQuoteSelector = content.getTextQuoteSelector();
      expect(textQuoteSelector).toEqual(selectors[0]);
    });

    it("should get TextPositionSelector from highlight content", () => {
      const selectors = [
        { type: "TextQuoteSelector" as const, exact: "highlighted text" },
        { type: "TextPositionSelector" as const, start: 100, end: 116 },
      ];
      const content = CardContent.createHighlightContent(
        "highlighted text",
        selectors
      ).unwrap();

      const textPositionSelector = content.getTextPositionSelector();
      expect(textPositionSelector).toEqual(selectors[1]);
    });

    it("should get RangeSelector from highlight content", () => {
      const selectors = [
        { type: "TextQuoteSelector" as const, exact: "highlighted text" },
        {
          type: "RangeSelector" as const,
          startContainer: "/html/body/p[1]",
          startOffset: 5,
          endContainer: "/html/body/p[1]",
          endOffset: 21,
        },
      ];
      const content = CardContent.createHighlightContent(
        "highlighted text",
        selectors
      ).unwrap();

      const rangeSelector = content.getRangeSelector();
      expect(rangeSelector).toEqual(selectors[1]);
    });

    it("should return undefined for selectors when not highlight content", () => {
      const content = CardContent.createNoteContent("Test note").unwrap();

      expect(content.getTextQuoteSelector()).toBeUndefined();
      expect(content.getTextPositionSelector()).toBeUndefined();
      expect(content.getRangeSelector()).toBeUndefined();
    });
  });

  describe("legacy create method", () => {
    it("should create URL content via legacy method", () => {
      const result = CardContent.create({
        type: CardTypeEnum.URL,
        url: validUrl,
      });

      expect(result.isOk()).toBe(true);
      const content = result.unwrap();
      expect(content.type).toBe(CardTypeEnum.URL);
    });

    it("should create note content via legacy method", () => {
      const result = CardContent.create({
        type: CardTypeEnum.NOTE,
        text: "Test note",
        title: "Test Title",
      });

      expect(result.isOk()).toBe(true);
      const content = result.unwrap();
      expect(content.type).toBe(CardTypeEnum.NOTE);
      expect(content.noteContent?.text).toBe("Test note");
      expect(content.noteContent?.title).toBe("Test Title");
    });

    it("should create highlight content via legacy method", () => {
      const selectors = [
        { type: "TextQuoteSelector" as const, exact: "highlighted text" },
      ];
      const result = CardContent.create({
        type: CardTypeEnum.HIGHLIGHT,
        text: "highlighted text",
        selectors,
        context: "some context",
      });

      expect(result.isOk()).toBe(true);
      const content = result.unwrap();
      expect(content.type).toBe(CardTypeEnum.HIGHLIGHT);
      expect(content.highlightContent?.text).toBe("highlighted text");
      expect(content.highlightContent?.context).toBe("some context");
    });

    it("should reject invalid type via legacy method", () => {
      const result = CardContent.create({
        type: "INVALID" as any,
      });

      expect(result.isErr()).toBe(true);
      expect(
        (result as Err<CardContent, CardContentValidationError>).error.message
      ).toBe("Invalid card content type");
    });
  });
});
