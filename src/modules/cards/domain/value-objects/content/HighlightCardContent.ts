import { ValueObject } from '../../../../../shared/domain/ValueObject';
import { ok, err, Result } from '../../../../../shared/core/Result';
import { CardTypeEnum } from '../CardType';

// Selector interfaces for robust highlight anchoring (Hypothes.is approach)
export interface TextQuoteSelector {
  type: 'TextQuoteSelector';
  exact: string; // The exact text being highlighted
  prefix?: string; // Text immediately before the selection
  suffix?: string; // Text immediately after the selection
}

export interface TextPositionSelector {
  type: 'TextPositionSelector';
  start: number; // Character offset from document start
  end: number; // Character offset from document start
}

export interface RangeSelector {
  type: 'RangeSelector';
  startContainer: string; // XPath or CSS selector to start container
  startOffset: number; // Offset within start container
  endContainer: string; // XPath or CSS selector to end container
  endOffset: number; // Offset within end container
}

export type HighlightSelector =
  | TextQuoteSelector
  | TextPositionSelector
  | RangeSelector;

export class HighlightCardContentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HighlightCardContentValidationError';
  }
}

interface HighlightCardContentProps {
  type: CardTypeEnum.HIGHLIGHT;
  text: string; // The highlighted text
  selectors: HighlightSelector[]; // Multiple selectors for robust anchoring
  context?: string; // Additional surrounding text for context
  documentUrl?: string; // URL of the document where highlight was made
  documentTitle?: string; // Title of the document
}

export class HighlightCardContent extends ValueObject<HighlightCardContentProps> {
  public static readonly MAX_TEXT_LENGTH = 5000;

  get type(): CardTypeEnum.HIGHLIGHT {
    return this.props.type;
  }

  get text(): string {
    return this.props.text;
  }

  get selectors(): HighlightSelector[] {
    return [...this.props.selectors]; // Defensive copy
  }

  get context(): string | undefined {
    return this.props.context;
  }

  get documentUrl(): string | undefined {
    return this.props.documentUrl;
  }

  get documentTitle(): string | undefined {
    return this.props.documentTitle;
  }

  // Helper methods for specific selector types
  getTextQuoteSelector(): TextQuoteSelector | undefined {
    return this.props.selectors.find(
      (s) => s.type === 'TextQuoteSelector',
    ) as TextQuoteSelector;
  }

  getTextPositionSelector(): TextPositionSelector | undefined {
    return this.props.selectors.find(
      (s) => s.type === 'TextPositionSelector',
    ) as TextPositionSelector;
  }

  getRangeSelector(): RangeSelector | undefined {
    return this.props.selectors.find(
      (s) => s.type === 'RangeSelector',
    ) as RangeSelector;
  }

  private constructor(props: HighlightCardContentProps) {
    super(props);
  }

  public static create(
    text: string,
    selectors: HighlightSelector[],
    options?: {
      context?: string;
      documentUrl?: string;
      documentTitle?: string;
    },
  ): Result<HighlightCardContent, HighlightCardContentValidationError> {
    if (!text || text.trim().length === 0) {
      return err(
        new HighlightCardContentValidationError(
          'Highlight text cannot be empty',
        ),
      );
    }

    if (text.length > this.MAX_TEXT_LENGTH) {
      return err(
        new HighlightCardContentValidationError(
          `Highlight text cannot exceed ${this.MAX_TEXT_LENGTH} characters`,
        ),
      );
    }

    if (!selectors || selectors.length === 0) {
      return err(
        new HighlightCardContentValidationError(
          'Highlight must have at least one selector',
        ),
      );
    }

    // Validate selectors
    const validationResult = HighlightCardContent.validateSelectors(selectors);
    if (validationResult.isErr()) {
      return err(validationResult.error);
    }

    return ok(
      new HighlightCardContent({
        type: CardTypeEnum.HIGHLIGHT,
        text: text.trim(),
        selectors: [...selectors], // Defensive copy
        context: options?.context?.trim(),
        documentUrl: options?.documentUrl?.trim(),
        documentTitle: options?.documentTitle?.trim(),
      }),
    );
  }

  private static validateSelectors(
    selectors: HighlightSelector[],
  ): Result<void, HighlightCardContentValidationError> {
    for (const selector of selectors) {
      switch (selector.type) {
        case 'TextQuoteSelector':
          if (!selector.exact || selector.exact.trim().length === 0) {
            return err(
              new HighlightCardContentValidationError(
                'TextQuoteSelector must have exact text',
              ),
            );
          }
          break;

        case 'TextPositionSelector':
          if (
            selector.start < 0 ||
            selector.end < 0 ||
            selector.start >= selector.end
          ) {
            return err(
              new HighlightCardContentValidationError(
                'TextPositionSelector must have valid start/end positions',
              ),
            );
          }
          break;

        case 'RangeSelector':
          if (!selector.startContainer || !selector.endContainer) {
            return err(
              new HighlightCardContentValidationError(
                'RangeSelector must have start and end containers',
              ),
            );
          }
          if (selector.startOffset < 0 || selector.endOffset < 0) {
            return err(
              new HighlightCardContentValidationError(
                'RangeSelector offsets must be non-negative',
              ),
            );
          }
          break;

        default:
          return err(
            new HighlightCardContentValidationError('Invalid selector type'),
          );
      }
    }
    return ok(undefined);
  }

  // Helper method to create highlight with common selector combination (Hypothes.is style)
  public static createWithHypothesisSelectors(
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
    },
  ): Result<HighlightCardContent, HighlightCardContentValidationError> {
    const selectors: HighlightSelector[] = [
      {
        type: 'TextQuoteSelector',
        exact,
        prefix,
        suffix,
      },
      {
        type: 'TextPositionSelector',
        start: startPos,
        end: endPos,
      },
    ];

    // Add RangeSelector if provided
    if (options?.rangeSelector) {
      selectors.push({
        type: 'RangeSelector',
        ...options.rangeSelector,
      });
    }

    return HighlightCardContent.create(text, selectors, {
      context: options?.context,
      documentUrl: options?.documentUrl,
      documentTitle: options?.documentTitle,
    });
  }
}
