import {
  HighlightCardContent,
  TextQuoteSelector,
  RangeSelector,
  HighlightSelector,
} from "../../../../domain/value-objects/content/HighlightCardContent";
import { JSDOM } from "jsdom";

describe("HighlightCardContent Integration Tests", () => {
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
      global.Node = dom.window.Node;
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
      const { Node } = dom.window;
      
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

      const textPositionSelector = {
        type: "TextPositionSelector" as const,
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
      
      // Check if we can find the exact text in the document
      const exactTextIndex = documentText.indexOf(textQuoteSelector.exact);
      expect(exactTextIndex).toBeGreaterThan(-1);
      
      // Also verify the prefix and suffix are correct
      const actualPrefix = documentText.substring(
        Math.max(0, exactTextIndex - textQuoteSelector.prefix.length),
        exactTextIndex
      );
      const actualSuffix = documentText.substring(
        exactTextIndex + textQuoteSelector.exact.length,
        exactTextIndex + textQuoteSelector.exact.length + textQuoteSelector.suffix.length
      );
      
      expect(actualPrefix.trim()).toBe(textQuoteSelector.prefix);
      expect(actualSuffix.trim()).toBe(textQuoteSelector.suffix);

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
