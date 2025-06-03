import { Result, ok, err } from '../../../../shared/core/Result';

export interface TextQuoteSelector {
  type: 'TextQuoteSelector';
  exact: string;
  prefix?: string;
  suffix?: string;
}

export interface TextPositionSelector {
  type: 'TextPositionSelector';
  start: number;
  end: number;
}

export interface RangeSelector {
  type: 'RangeSelector';
  startContainer: string;
  startOffset: number;
  endContainer: string;
  endOffset: number;
}

export type HighlightSelector = TextQuoteSelector | TextPositionSelector | RangeSelector;

export interface AnchoringContext {
  documentText: string;
  documentUrl?: string;
  documentTitle?: string;
}

export interface HighlightMatch {
  start: number;
  end: number;
  confidence: number; // 0-1 score indicating match confidence
}

export class HighlightAnchoringError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HighlightAnchoringError';
  }
}

/**
 * Service for anchoring highlights in documents using multiple selector strategies
 * Based on Hypothes.is approach with fallback mechanisms
 */
export class HighlightAnchoringService {
  
  /**
   * Attempt to find a highlight in a document using multiple selectors
   * Tries selectors in order of reliability: TextQuote -> TextPosition -> Range
   */
  public static findHighlight(
    selectors: HighlightSelector[],
    context: AnchoringContext
  ): Result<HighlightMatch, HighlightAnchoringError> {
    
    // Try TextQuoteSelector first (most resilient)
    const textQuoteSelector = selectors.find(s => s.type === 'TextQuoteSelector') as TextQuoteSelector;
    if (textQuoteSelector) {
      const result = this.findByTextQuote(textQuoteSelector, context);
      if (result.isOk()) {
        return result;
      }
    }

    // Try TextPositionSelector (faster but less resilient)
    const textPositionSelector = selectors.find(s => s.type === 'TextPositionSelector') as TextPositionSelector;
    if (textPositionSelector) {
      const result = this.findByTextPosition(textPositionSelector, context);
      if (result.isOk()) {
        return result;
      }
    }

    // Try RangeSelector (DOM-specific, least portable)
    const rangeSelector = selectors.find(s => s.type === 'RangeSelector') as RangeSelector;
    if (rangeSelector) {
      const result = this.findByRange(rangeSelector, context);
      if (result.isOk()) {
        return result;
      }
    }

    return err(new HighlightAnchoringError('Could not anchor highlight using any selector'));
  }

  /**
   * Find highlight using text quote with prefix/suffix matching
   */
  private static findByTextQuote(
    selector: TextQuoteSelector,
    context: AnchoringContext
  ): Result<HighlightMatch, HighlightAnchoringError> {
    
    const { exact, prefix, suffix } = selector;
    const { documentText } = context;

    // Find all occurrences of the exact text
    const exactMatches: number[] = [];
    let index = documentText.indexOf(exact);
    while (index !== -1) {
      exactMatches.push(index);
      index = documentText.indexOf(exact, index + 1);
    }

    if (exactMatches.length === 0) {
      return err(new HighlightAnchoringError('Exact text not found in document'));
    }

    // If only one match, return it
    if (exactMatches.length === 1) {
      return ok({
        start: exactMatches[0],
        end: exactMatches[0] + exact.length,
        confidence: 0.9
      });
    }

    // Multiple matches - use prefix/suffix to disambiguate
    let bestMatch: HighlightMatch | null = null;
    let bestScore = 0;

    for (const matchStart of exactMatches) {
      const matchEnd = matchStart + exact.length;
      let score = 0.5; // Base score for exact match

      // Check prefix match
      if (prefix) {
        const actualPrefix = documentText.substring(
          Math.max(0, matchStart - prefix.length),
          matchStart
        );
        if (actualPrefix === prefix) {
          score += 0.3;
        } else if (actualPrefix.endsWith(prefix)) {
          score += 0.2;
        }
      }

      // Check suffix match
      if (suffix) {
        const actualSuffix = documentText.substring(
          matchEnd,
          Math.min(documentText.length, matchEnd + suffix.length)
        );
        if (actualSuffix === suffix) {
          score += 0.3;
        } else if (actualSuffix.startsWith(suffix)) {
          score += 0.2;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = {
          start: matchStart,
          end: matchEnd,
          confidence: score
        };
      }
    }

    if (bestMatch && bestMatch.confidence > 0.6) {
      return ok(bestMatch);
    }

    return err(new HighlightAnchoringError('Could not disambiguate multiple text matches'));
  }

  /**
   * Find highlight using character position (simple but fragile)
   */
  private static findByTextPosition(
    selector: TextPositionSelector,
    context: AnchoringContext
  ): Result<HighlightMatch, HighlightAnchoringError> {
    
    const { start, end } = selector;
    const { documentText } = context;

    if (start < 0 || end > documentText.length || start >= end) {
      return err(new HighlightAnchoringError('Invalid text position'));
    }

    return ok({
      start,
      end,
      confidence: 0.7 // Lower confidence as positions can shift
    });
  }

  /**
   * Find highlight using DOM range (placeholder - would need DOM access)
   */
  private static findByRange(
    selector: RangeSelector,
    context: AnchoringContext
  ): Result<HighlightMatch, HighlightAnchoringError> {
    
    // This would require DOM manipulation in a browser environment
    // For now, return an error as this is primarily for server-side use
    return err(new HighlightAnchoringError('RangeSelector not supported in this context'));
  }

  /**
   * Create selectors for a new highlight
   */
  public static createSelectors(
    text: string,
    start: number,
    end: number,
    context: AnchoringContext,
    options?: {
      prefixLength?: number;
      suffixLength?: number;
    }
  ): HighlightSelector[] {
    
    const prefixLength = options?.prefixLength || 32;
    const suffixLength = options?.suffixLength || 32;
    const { documentText } = context;

    const selectors: HighlightSelector[] = [];

    // Create TextQuoteSelector
    const prefix = documentText.substring(
      Math.max(0, start - prefixLength),
      start
    );
    const suffix = documentText.substring(
      end,
      Math.min(documentText.length, end + suffixLength)
    );

    selectors.push({
      type: 'TextQuoteSelector',
      exact: text,
      prefix,
      suffix
    });

    // Create TextPositionSelector
    selectors.push({
      type: 'TextPositionSelector',
      start,
      end
    });

    return selectors;
  }
}
