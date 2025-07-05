import {
  HighlightCardContent,
  HighlightCardContentValidationError,
  TextQuoteSelector,
  TextPositionSelector,
  RangeSelector,
  HighlightSelector,
} from "../../../../domain/value-objects/content/HighlightCardContent";
import { CardTypeEnum } from "../../../../domain/value-objects/CardType";
import { Err } from "src/shared/core/Result";

describe("HighlightCardContent", () => {
  const validTextQuoteSelector: TextQuoteSelector = {
    type: "TextQuoteSelector",
    exact: "highlighted text",
    prefix: "some ",
    suffix: " here",
  };

  const validTextPositionSelector: TextPositionSelector = {
    type: "TextPositionSelector",
    start: 100,
    end: 116,
  };

  const validRangeSelector: RangeSelector = {
    type: "RangeSelector",
    startContainer: "/html/body/p[1]",
    startOffset: 5,
    endContainer: "/html/body/p[1]",
    endOffset: 21,
  };

  describe("creation", () => {
    it("should create highlight content with single selector", () => {
      const result = HighlightCardContent.create("highlighted text", [
        validTextQuoteSelector,
      ]);

      expect(result.isOk()).toBe(true);
      const content = result.unwrap();
      expect(content.type).toBe(CardTypeEnum.HIGHLIGHT);
      expect(content.text).toBe("highlighted text");
      expect(content.selectors).toHaveLength(1);
      expect(content.selectors[0]).toEqual(validTextQuoteSelector);
    });

    it("should create highlight content with multiple selectors", () => {
      const selectors = [
        validTextQuoteSelector,
        validTextPositionSelector,
        validRangeSelector,
      ];
      const result = HighlightCardContent.create("highlighted text", selectors);

      expect(result.isOk()).toBe(true);
      const content = result.unwrap();
      expect(content.selectors).toHaveLength(3);
      expect(content.selectors).toEqual(selectors);
    });

    it("should create highlight content with options", () => {
      const result = HighlightCardContent.create(
        "highlighted text",
        [validTextQuoteSelector],
        {
          context: "This is some highlighted text here for context",
          documentUrl: "https://example.com/article",
          documentTitle: "Example Article",
        }
      );

      expect(result.isOk()).toBe(true);
      const content = result.unwrap();
      expect(content.context).toBe(
        "This is some highlighted text here for context"
      );
      expect(content.documentUrl).toBe("https://example.com/article");
      expect(content.documentTitle).toBe("Example Article");
    });

    it("should trim whitespace from text and options", () => {
      const result = HighlightCardContent.create(
        "  highlighted text  ",
        [validTextQuoteSelector],
        {
          context: "  context  ",
          documentUrl: "  https://example.com  ",
          documentTitle: "  Title  ",
        }
      );

      expect(result.isOk()).toBe(true);
      const content = result.unwrap();
      expect(content.text).toBe("highlighted text");
      expect(content.context).toBe("context");
      expect(content.documentUrl).toBe("https://example.com");
      expect(content.documentTitle).toBe("Title");
    });

    it("should reject empty text", () => {
      const result = HighlightCardContent.create("", [validTextQuoteSelector]);

      expect(result.isErr()).toBe(true);
      expect(
        (
          result as Err<
            HighlightCardContent,
            HighlightCardContentValidationError
          >
        ).error
      ).toBeInstanceOf(HighlightCardContentValidationError);
      expect(
        (
          result as Err<
            HighlightCardContent,
            HighlightCardContentValidationError
          >
        ).error.message
      ).toBe("Highlight text cannot be empty");
    });

    it("should reject whitespace-only text", () => {
      const result = HighlightCardContent.create("   ", [
        validTextQuoteSelector,
      ]);

      expect(result.isErr()).toBe(true);
      expect(
        (
          result as Err<
            HighlightCardContent,
            HighlightCardContentValidationError
          >
        ).error.message
      ).toBe("Highlight text cannot be empty");
    });

    it("should reject text exceeding max length", () => {
      const longText = "a".repeat(HighlightCardContent.MAX_TEXT_LENGTH + 1);
      const result = HighlightCardContent.create(longText, [
        validTextQuoteSelector,
      ]);

      expect(result.isErr()).toBe(true);
      expect(
        (
          result as Err<
            HighlightCardContent,
            HighlightCardContentValidationError
          >
        ).error.message
      ).toBe(
        `Highlight text cannot exceed ${HighlightCardContent.MAX_TEXT_LENGTH} characters`
      );
    });

    it("should reject empty selectors array", () => {
      const result = HighlightCardContent.create("highlighted text", []);

      expect(result.isErr()).toBe(true);
      expect(
        (
          result as Err<
            HighlightCardContent,
            HighlightCardContentValidationError
          >
        ).error.message
      ).toBe("Highlight must have at least one selector");
    });
  });

  describe("selector validation", () => {
    it("should reject TextQuoteSelector with empty exact text", () => {
      const invalidSelector: TextQuoteSelector = {
        type: "TextQuoteSelector",
        exact: "",
      };

      const result = HighlightCardContent.create("highlighted text", [
        invalidSelector,
      ]);

      expect(result.isErr()).toBe(true);
      expect(
        (
          result as Err<
            HighlightCardContent,
            HighlightCardContentValidationError
          >
        ).error.message
      ).toBe("TextQuoteSelector must have exact text");
    });

    it("should reject TextPositionSelector with invalid positions", () => {
      const invalidSelector: TextPositionSelector = {
        type: "TextPositionSelector",
        start: 100,
        end: 50, // end before start
      };

      const result = HighlightCardContent.create("highlighted text", [
        invalidSelector,
      ]);

      expect(result.isErr()).toBe(true);
      expect(
        (
          result as Err<
            HighlightCardContent,
            HighlightCardContentValidationError
          >
        ).error.message
      ).toBe("TextPositionSelector must have valid start/end positions");
    });

    it("should reject TextPositionSelector with negative positions", () => {
      const invalidSelector: TextPositionSelector = {
        type: "TextPositionSelector",
        start: -1,
        end: 10,
      };

      const result = HighlightCardContent.create("highlighted text", [
        invalidSelector,
      ]);

      expect(result.isErr()).toBe(true);
      expect(
        (
          result as Err<
            HighlightCardContent,
            HighlightCardContentValidationError
          >
        ).error.message
      ).toBe("TextPositionSelector must have valid start/end positions");
    });

    it("should reject RangeSelector with missing containers", () => {
      const invalidSelector: RangeSelector = {
        type: "RangeSelector",
        startContainer: "",
        startOffset: 0,
        endContainer: "/html/body/p[1]",
        endOffset: 10,
      };

      const result = HighlightCardContent.create("highlighted text", [
        invalidSelector,
      ]);

      expect(result.isErr()).toBe(true);
      expect(
        (
          result as Err<
            HighlightCardContent,
            HighlightCardContentValidationError
          >
        ).error.message
      ).toBe("RangeSelector must have start and end containers");
    });

    it("should reject RangeSelector with negative offsets", () => {
      const invalidSelector: RangeSelector = {
        type: "RangeSelector",
        startContainer: "/html/body/p[1]",
        startOffset: -1,
        endContainer: "/html/body/p[1]",
        endOffset: 10,
      };

      const result = HighlightCardContent.create("highlighted text", [
        invalidSelector,
      ]);

      expect(result.isErr()).toBe(true);
      expect(
        (
          result as Err<
            HighlightCardContent,
            HighlightCardContentValidationError
          >
        ).error.message
      ).toBe("RangeSelector offsets must be non-negative");
    });
  });

  describe("selector helper methods", () => {
    it("should find TextQuoteSelector", () => {
      const selectors = [validTextQuoteSelector, validTextPositionSelector];
      const content = HighlightCardContent.create(
        "highlighted text",
        selectors
      ).unwrap();

      const textQuoteSelector = content.getTextQuoteSelector();
      expect(textQuoteSelector).toEqual(validTextQuoteSelector);
    });

    it("should find TextPositionSelector", () => {
      const selectors = [validTextQuoteSelector, validTextPositionSelector];
      const content = HighlightCardContent.create(
        "highlighted text",
        selectors
      ).unwrap();

      const textPositionSelector = content.getTextPositionSelector();
      expect(textPositionSelector).toEqual(validTextPositionSelector);
    });

    it("should find RangeSelector", () => {
      const selectors = [validTextQuoteSelector, validRangeSelector];
      const content = HighlightCardContent.create(
        "highlighted text",
        selectors
      ).unwrap();

      const rangeSelector = content.getRangeSelector();
      expect(rangeSelector).toEqual(validRangeSelector);
    });

    it("should return undefined when selector type not found", () => {
      const content = HighlightCardContent.create("highlighted text", [
        validTextQuoteSelector,
      ]).unwrap();

      expect(content.getTextPositionSelector()).toBeUndefined();
      expect(content.getRangeSelector()).toBeUndefined();
    });
  });

  describe("createWithHypothesisSelectors", () => {
    it("should create highlight with Hypothes.is-style selectors", () => {
      const result = HighlightCardContent.createWithHypothesisSelectors(
        "highlighted text",
        "highlighted text",
        "some ",
        " here",
        100,
        116
      );

      expect(result.isOk()).toBe(true);
      const content = result.unwrap();
      expect(content.selectors).toHaveLength(2);

      const textQuoteSelector = content.getTextQuoteSelector();
      expect(textQuoteSelector).toEqual({
        type: "TextQuoteSelector",
        exact: "highlighted text",
        prefix: "some ",
        suffix: " here",
      });

      const textPositionSelector = content.getTextPositionSelector();
      expect(textPositionSelector).toEqual({
        type: "TextPositionSelector",
        start: 100,
        end: 116,
      });
    });

    it("should create highlight with range selector when provided", () => {
      const result = HighlightCardContent.createWithHypothesisSelectors(
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
      expect(content.selectors).toHaveLength(3);

      const rangeSelector = content.getRangeSelector();
      expect(rangeSelector).toEqual({
        type: "RangeSelector",
        startContainer: "/html/body/p[1]",
        startOffset: 5,
        endContainer: "/html/body/p[1]",
        endOffset: 21,
      });
    });
  });

  describe("immutability", () => {
    it("should return defensive copy of selectors", () => {
      const originalSelectors = [
        validTextQuoteSelector,
        validTextPositionSelector,
      ];
      const content = HighlightCardContent.create(
        "highlighted text",
        originalSelectors
      ).unwrap();

      const returnedSelectors = content.selectors;
      returnedSelectors.push(validRangeSelector);

      // Original content should not be affected
      expect(content.selectors).toHaveLength(2);
      expect(returnedSelectors).toHaveLength(3);
    });
  });
});
