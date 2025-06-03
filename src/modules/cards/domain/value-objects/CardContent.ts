import { ValueObject } from "../../../../shared/domain/ValueObject";
import { CardTypeEnum } from "./CardType";
import { ok, err, Result } from "../../../../shared/core/Result";
import { UrlMetadata } from "./UrlMetadata";
import { URL } from "./URL";

// Base interface for all card content
interface BaseCardContentProps {
  type: CardTypeEnum;
}

// Specific content interfaces
interface UrlCardContentProps extends BaseCardContentProps {
  type: CardTypeEnum.URL;
  url: URL;
  metadata?: UrlMetadata;
}

interface NoteCardContentProps extends BaseCardContentProps {
  type: CardTypeEnum.NOTE;
  text: string;
  title?: string;
}

// Selector interfaces for robust highlight anchoring (Hypothes.is approach)
interface TextQuoteSelector {
  type: 'TextQuoteSelector';
  exact: string; // The exact text being highlighted
  prefix?: string; // Text immediately before the selection
  suffix?: string; // Text immediately after the selection
}

interface TextPositionSelector {
  type: 'TextPositionSelector';
  start: number; // Character offset from document start
  end: number; // Character offset from document start
}

interface RangeSelector {
  type: 'RangeSelector';
  startContainer: string; // XPath or CSS selector to start container
  startOffset: number; // Offset within start container
  endContainer: string; // XPath or CSS selector to end container
  endOffset: number; // Offset within end container
}

type HighlightSelector = TextQuoteSelector | TextPositionSelector | RangeSelector;

interface HighlightCardContentProps extends BaseCardContentProps {
  type: CardTypeEnum.HIGHLIGHT;
  text: string; // The highlighted text
  selectors: HighlightSelector[]; // Multiple selectors for robust anchoring
  context?: string; // Additional surrounding text for context
  documentUrl?: string; // URL of the document where highlight was made
  documentTitle?: string; // Title of the document
}

type CardContentProps = UrlCardContentProps | NoteCardContentProps | HighlightCardContentProps;

export class CardContentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CardContentValidationError';
  }
}

export class CardContent extends ValueObject<CardContentProps> {
  get type(): CardTypeEnum {
    return this.props.type;
  }

  // Type-safe getters
  get urlContent(): UrlCardContentProps | null {
    return this.props.type === CardTypeEnum.URL ? (this.props as UrlCardContentProps) : null;
  }

  get noteContent(): NoteCardContentProps | null {
    return this.props.type === CardTypeEnum.NOTE ? (this.props as NoteCardContentProps) : null;
  }

  get highlightContent(): HighlightCardContentProps | null {
    return this.props.type === CardTypeEnum.HIGHLIGHT ? (this.props as HighlightCardContentProps) : null;
  }

  // Helper methods for highlight content
  getTextQuoteSelector(): TextQuoteSelector | undefined {
    const highlight = this.highlightContent;
    return highlight?.selectors.find(s => s.type === 'TextQuoteSelector') as TextQuoteSelector;
  }

  getTextPositionSelector(): TextPositionSelector | undefined {
    const highlight = this.highlightContent;
    return highlight?.selectors.find(s => s.type === 'TextPositionSelector') as TextPositionSelector;
  }

  getRangeSelector(): RangeSelector | undefined {
    const highlight = this.highlightContent;
    return highlight?.selectors.find(s => s.type === 'RangeSelector') as RangeSelector;
  }

  private constructor(props: CardContentProps) {
    super(props);
  }

  public static createUrlContent(url: URL, metadata?: UrlMetadata): Result<CardContent, CardContentValidationError> {
    return ok(new CardContent({
      type: CardTypeEnum.URL,
      url,
      metadata
    }));
  }

  public static createNoteContent(text: string, title?: string): Result<CardContent, CardContentValidationError> {
    if (!text || text.trim().length === 0) {
      return err(new CardContentValidationError("Note text cannot be empty"));
    }

    if (text.length > 10000) {
      return err(new CardContentValidationError("Note text cannot exceed 10,000 characters"));
    }

    return ok(new CardContent({
      type: CardTypeEnum.NOTE,
      text: text.trim(),
      title: title?.trim()
    }));
  }

  public static createHighlightContent(
    text: string,
    selectors: HighlightSelector[],
    options?: {
      context?: string;
      documentUrl?: string;
      documentTitle?: string;
    }
  ): Result<CardContent, CardContentValidationError> {
    if (!text || text.trim().length === 0) {
      return err(new CardContentValidationError("Highlight text cannot be empty"));
    }

    if (text.length > 5000) {
      return err(new CardContentValidationError("Highlight text cannot exceed 5,000 characters"));
    }

    if (!selectors || selectors.length === 0) {
      return err(new CardContentValidationError("Highlight must have at least one selector"));
    }

    // Validate selectors
    const validationResult = CardContent.validateHighlightSelectors(selectors);
    if (validationResult.isErr()) {
      return err(validationResult.error);
    }

    return ok(new CardContent({
      type: CardTypeEnum.HIGHLIGHT,
      text: text.trim(),
      selectors,
      context: options?.context?.trim(),
      documentUrl: options?.documentUrl?.trim(),
      documentTitle: options?.documentTitle?.trim()
    }));
  }

  private static validateHighlightSelectors(
    selectors: HighlightSelector[]
  ): Result<void, CardContentValidationError> {
    for (const selector of selectors) {
      switch (selector.type) {
        case 'TextQuoteSelector':
          if (!selector.exact || selector.exact.trim().length === 0) {
            return err(new CardContentValidationError("TextQuoteSelector must have exact text"));
          }
          break;
        
        case 'TextPositionSelector':
          if (selector.start < 0 || selector.end < 0 || selector.start >= selector.end) {
            return err(new CardContentValidationError("TextPositionSelector must have valid start/end positions"));
          }
          break;
        
        case 'RangeSelector':
          if (!selector.startContainer || !selector.endContainer) {
            return err(new CardContentValidationError("RangeSelector must have start and end containers"));
          }
          if (selector.startOffset < 0 || selector.endOffset < 0) {
            return err(new CardContentValidationError("RangeSelector offsets must be non-negative"));
          }
          break;
        
        default:
          return err(new CardContentValidationError("Invalid selector type"));
      }
    }
    return ok(undefined);
  }

  // Helper method to create highlight with common selector combination (Hypothes.is style)
  public static createHighlightWithHypothesisSelectors(
    text: string,
    exact: string,
    prefix: string,
    suffix: string,
    startPos: number,
    endPos: number,
    options?: {
      context?: string;
      documentUrl?: string;
      documentTitle?: string;
      rangeSelector?: Omit<RangeSelector, 'type'>;
    }
  ): Result<CardContent, CardContentValidationError> {
    const selectors: HighlightSelector[] = [
      {
        type: 'TextQuoteSelector',
        exact,
        prefix,
        suffix
      },
      {
        type: 'TextPositionSelector',
        start: startPos,
        end: endPos
      }
    ];

    // Add RangeSelector if provided
    if (options?.rangeSelector) {
      selectors.push({
        type: 'RangeSelector',
        ...options.rangeSelector
      });
    }

    return CardContent.createHighlightContent(text, selectors, {
      context: options?.context,
      documentUrl: options?.documentUrl,
      documentTitle: options?.documentTitle
    });
  }

  // Legacy create method for backward compatibility
  public static create(props: CardContentProps): Result<CardContent, CardContentValidationError> {
    switch (props.type) {
      case CardTypeEnum.URL:
        const urlProps = props as UrlCardContentProps;
        return CardContent.createUrlContent(urlProps.url, urlProps.metadata);
      
      case CardTypeEnum.NOTE:
        const noteProps = props as NoteCardContentProps;
        return CardContent.createNoteContent(noteProps.text, noteProps.title);
      
      case CardTypeEnum.HIGHLIGHT:
        const highlightProps = props as HighlightCardContentProps;
        return CardContent.createHighlightContent(
          highlightProps.text,
          highlightProps.selectors,
          {
            context: highlightProps.context,
            documentUrl: highlightProps.documentUrl,
            documentTitle: highlightProps.documentTitle
          }
        );
      
      default:
        return err(new CardContentValidationError("Invalid card content type"));
    }
  }
}
