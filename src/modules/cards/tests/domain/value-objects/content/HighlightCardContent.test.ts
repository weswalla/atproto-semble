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
import { JSDOM } from "jsdom";

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

  describe("HTML document annotation (browser extension simulation)", () => {
    let dom: JSDOM;
    let document: Document;

    beforeEach(() => {
      // Create a realistic HTML document for testing
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Test Article</title>
          </head>
          <body>
            <article>
              <h1>The Future of Web Annotations</h1>
              <p>Web annotations are becoming increasingly important for collaborative research and knowledge sharing. They allow users to highlight, comment, and share insights directly on web content.</p>
              <p>Modern annotation systems use multiple selector types to ensure robust anchoring across different browsers and document changes. This includes text quote selectors, position selectors, and range selectors.</p>
              <blockquote>
                "The ability to annotate any web content opens up new possibilities for distributed collaboration and peer review."
              </blockquote>
              <p>Browser extensions can capture user selections and generate these selectors automatically, making the annotation process seamless for end users.</p>
            </article>
          </body>
        </html>
      `;

      dom = new JSDOM(htmlContent);
      document = dom.window.document;

      // Set up global document for JSDOM
      global.document = document;
      global.window = dom.window as any;
    });

    afterEach(() => {
      dom.window.close();
    });

    // Helper function to simulate text selection in browser
    function simulateTextSelection(
      startNode: Node,
      startOffset: number,
      endNode: Node,
      endOffset: number
    ) {
      const range = document.createRange();
      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);
      return range;
    }

    // Helper function to get text content with position
    function getDocumentTextContent(): string {
      return document.body.textContent || "";
    }

    // Helper function to find text position in document
    function findTextPosition(
      searchText: string,
      documentText: string
    ): { start: number; end: number } | null {
      const start = documentText.indexOf(searchText);
      if (start === -1) return null;
      return { start, end: start + searchText.length };
    }

    // Helper function to generate XPath for an element
    function getXPath(element: Node): string {
      if (element.nodeType === Node.TEXT_NODE) {
        const parent = element.parentNode;
        if (!parent) return "";
        const textNodes = Array.from(parent.childNodes).filter(
          (n) => n.nodeType === Node.TEXT_NODE
        );
        const index = textNodes.indexOf(element as Text);
        return `${getXPath(parent)}/text()[${index + 1}]`;
      }

      if (element.nodeType === Node.ELEMENT_NODE) {
        const elem = element as Element;
        if (elem.id) {
          return `//*[@id="${elem.id}"]`;
        }

        const parent = elem.parentNode;
        if (!parent || parent.nodeType !== Node.ELEMENT_NODE) {
          return `/${elem.tagName.toLowerCase()}`;
        }

        const siblings = Array.from(parent.children).filter(
          (e) => e.tagName === elem.tagName
        );
        const index = siblings.indexOf(elem);
        return `${getXPath(parent)}/${elem.tagName.toLowerCase()}[${index + 1}]`;
      }

      return "";
    }

    it("should create highlight from browser text selection", () => {
      // Simulate user selecting text in the first paragraph
      const firstParagraph = document.querySelector("p");
      expect(firstParagraph).toBeTruthy();

      const textNode = firstParagraph!.firstChild as Text;
      const selectedText =
        "Web annotations are becoming increasingly important";

      // Create a range selection (simulating browser selection)
      const range = simulateTextSelection(
        textNode,
        0,
        textNode,
        selectedText.length
      );
      const rangeText = range.toString();

      expect(rangeText).toBe(selectedText);

      // Get document text for position calculation
      const documentText = getDocumentTextContent();
      const position = findTextPosition(selectedText, documentText);
      expect(position).toBeTruthy();

      // Generate selectors as a browser extension would
      const textQuoteSelector: TextQuoteSelector = {
        type: "TextQuoteSelector",
        exact: selectedText,
        prefix: "",
        suffix: " for collaborative research",
      };

      const textPositionSelector: TextPositionSelector = {
        type: "TextPositionSelector",
        start: position!.start,
        end: position!.end,
      };

      const rangeSelector: RangeSelector = {
        type: "RangeSelector",
        startContainer: getXPath(range.startContainer),
        startOffset: range.startOffset,
        endContainer: getXPath(range.endContainer),
        endOffset: range.endOffset,
      };

      // Create highlight content with all selectors
      const result = HighlightCardContent.create(
        selectedText,
        [textQuoteSelector, textPositionSelector, rangeSelector],
        {
          documentUrl: "https://example.com/article",
          documentTitle: document.title,
          context: firstParagraph!.textContent || undefined,
        }
      );

      expect(result.isOk()).toBe(true);
      const content = result.unwrap();
      expect(content.text).toBe(selectedText);
      expect(content.documentTitle).toBe("Test Article");
      expect(content.selectors).toHaveLength(3);
    });

    it("should handle cross-element text selection", () => {
      // Simulate selecting text that spans multiple elements
      const firstP = document.querySelector("p");
      const secondP = document.querySelectorAll("p")[1];

      expect(firstP && secondP).toBeTruthy();

      const startText = firstP!.firstChild as Text;
      const endText = secondP!.firstChild as Text;

      // Select from end of first paragraph to start of second
      const startOffset = startText.textContent!.length - 20; // Last 20 chars of first p
      const endOffset = 30; // First 30 chars of second p

      const range = simulateTextSelection(
        startText,
        startOffset,
        endText,
        endOffset
      );
      const selectedText = range.toString();

      // This should create a selection spanning elements
      expect(selectedText.length).toBeGreaterThan(0);

      const rangeSelector: RangeSelector = {
        type: "RangeSelector",
        startContainer: getXPath(startText),
        startOffset: startOffset,
        endContainer: getXPath(endText),
        endOffset: endOffset,
      };

      const result = HighlightCardContent.create(selectedText, [rangeSelector]);
      expect(result.isOk()).toBe(true);
    });

    it("should handle blockquote selection", () => {
      const blockquote = document.querySelector("blockquote");
      expect(blockquote).toBeTruthy();

      const quoteText = blockquote!.textContent!.trim();
      const selectedPortion = "annotate any web content";

      const textNode = blockquote!.firstChild as Text;
      const startOffset = quoteText.indexOf(selectedPortion);
      const endOffset = startOffset + selectedPortion.length;

      const range = simulateTextSelection(
        textNode,
        startOffset,
        textNode,
        endOffset
      );

      const textQuoteSelector: TextQuoteSelector = {
        type: "TextQuoteSelector",
        exact: selectedPortion,
        prefix: "The ability to ",
        suffix: " opens up new",
      };

      const rangeSelector: RangeSelector = {
        type: "RangeSelector",
        startContainer: getXPath(textNode),
        startOffset: startOffset,
        endContainer: getXPath(textNode),
        endOffset: endOffset,
      };

      const result = HighlightCardContent.create(
        selectedPortion,
        [textQuoteSelector, rangeSelector],
        {
          context: quoteText,
          documentUrl: "https://example.com/article",
        }
      );

      expect(result.isOk()).toBe(true);
      const content = result.unwrap();
      expect(content.context).toBe(quoteText);
      expect(content.getTextQuoteSelector()?.prefix).toBe("The ability to ");
    });

    it("should generate robust selectors for annotation recovery", () => {
      // Test that we can "find" an annotation again using the selectors
      const targetText = "multiple selector types";
      const paragraph = document.querySelectorAll("p")[1];
      const fullText = paragraph!.textContent!;

      // Generate selectors as if creating the annotation
      const exactMatch = targetText;
      const startIndex = fullText.indexOf(targetText);
      const prefix = fullText.substring(
        Math.max(0, startIndex - 20),
        startIndex
      );
      const suffix = fullText.substring(
        startIndex + targetText.length,
        startIndex + targetText.length + 20
      );

      const documentText = getDocumentTextContent();
      const globalPosition = findTextPosition(targetText, documentText);

      const selectors: HighlightSelector[] = [
        {
          type: "TextQuoteSelector",
          exact: exactMatch,
          prefix: prefix.trim(),
          suffix: suffix.trim(),
        },
        {
          type: "TextPositionSelector",
          start: globalPosition!.start,
          end: globalPosition!.end,
        },
      ];

      const result = HighlightCardContent.create(targetText, selectors);
      expect(result.isOk()).toBe(true);

      const content = result.unwrap();

      // Simulate "finding" the annotation again using TextQuoteSelector
      const textQuoteSelector = content.getTextQuoteSelector()!;
      const searchPattern =
        textQuoteSelector.prefix +
        textQuoteSelector.exact +
        textQuoteSelector.suffix;
      const foundIndex = documentText.indexOf(searchPattern);

      expect(foundIndex).toBeGreaterThan(-1);

      // Verify position selector still works
      const positionSelector = content.getTextPositionSelector()!;
      const extractedText = documentText.substring(
        positionSelector.start,
        positionSelector.end
      );
      expect(extractedText).toBe(targetText);
    });

    it("should handle edge cases in HTML documents", () => {
      // Test selection at document boundaries
      const title = document.querySelector("h1");
      const titleText = title!.textContent!;

      // Select entire title
      const range = simulateTextSelection(
        title!.firstChild!,
        0,
        title!.firstChild!,
        titleText.length
      );

      const selectors: HighlightSelector[] = [
        {
          type: "TextQuoteSelector",
          exact: titleText,
          prefix: "",
          suffix: "",
        },
        {
          type: "RangeSelector",
          startContainer: getXPath(title!.firstChild!),
          startOffset: 0,
          endContainer: getXPath(title!.firstChild!),
          endOffset: titleText.length,
        },
      ];

      const result = HighlightCardContent.create(titleText, selectors, {
        documentTitle: document.title,
      });

      expect(result.isOk()).toBe(true);
      const content = result.unwrap();
      expect(content.text).toBe(titleText);
      expect(content.getTextQuoteSelector()?.prefix).toBe("");
      expect(content.getTextQuoteSelector()?.suffix).toBe("");
    });
  });
});
