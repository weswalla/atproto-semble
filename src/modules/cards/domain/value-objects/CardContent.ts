import { ValueObject } from "../../../../shared/domain/ValueObject";
import { CardTypeEnum } from "./CardType";
import { ok, err, Result } from "../../../../shared/core/Result";
import { UrlMetadata } from "./UrlMetadata";
import { URL } from "./URL";
import { UrlCardContent } from "./content/UrlCardContent";
import { NoteCardContent } from "./content/NoteCardContent";
import {
  HighlightCardContent,
  HighlightSelector,
  TextQuoteSelector,
  TextPositionSelector,
  RangeSelector,
} from "./content/HighlightCardContent";
import { CuratorId } from "src/modules/annotations/domain/value-objects";

// Union type for all card content types
type CardContentUnion = UrlCardContent | NoteCardContent | HighlightCardContent;

export type CreateCardPropsBase = {
  type: CardTypeEnum;
};
interface CreateUrlCardProps extends CreateCardPropsBase {
  type: CardTypeEnum.URL;
  url: URL;
  metadata: UrlMetadata;
}
interface CreateNoteCardProps extends CreateCardPropsBase {
  type: CardTypeEnum.NOTE;
  authorId: CuratorId;
  text: string;
}

export type CreateCardProps = CreateUrlCardProps | CreateNoteCardProps;
export class CardContentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CardContentValidationError";
  }
}

// Re-export selector types for convenience
export type {
  HighlightSelector,
  TextQuoteSelector,
  TextPositionSelector,
  RangeSelector,
};

export class CardContent extends ValueObject<{ content: CardContentUnion }> {
  get type(): CardTypeEnum {
    return this.props.content.type;
  }

  get content(): CardContentUnion {
    return this.props.content;
  }

  // Type-safe getters
  get urlContent(): UrlCardContent | null {
    return this.props.content instanceof UrlCardContent
      ? this.props.content
      : null;
  }

  get noteContent(): NoteCardContent | null {
    return this.props.content instanceof NoteCardContent
      ? this.props.content
      : null;
  }

  get highlightContent(): HighlightCardContent | null {
    return this.props.content instanceof HighlightCardContent
      ? this.props.content
      : null;
  }

  // Helper methods for highlight content (delegated to HighlightCardContent)
  getTextQuoteSelector(): TextQuoteSelector | undefined {
    return this.highlightContent?.getTextQuoteSelector();
  }

  getTextPositionSelector(): TextPositionSelector | undefined {
    return this.highlightContent?.getTextPositionSelector();
  }

  getRangeSelector(): RangeSelector | undefined {
    return this.highlightContent?.getRangeSelector();
  }

  private constructor(content: CardContentUnion) {
    super({ content });
  }

  // Factory methods that delegate to specific content classes
  public static createUrlContent(
    url: URL,
    metadata?: UrlMetadata
  ): Result<CardContent, CardContentValidationError> {
    const urlContentResult = UrlCardContent.create(url, metadata);
    if (urlContentResult.isErr()) {
      return err(
        new CardContentValidationError(urlContentResult.error.message)
      );
    }
    return ok(new CardContent(urlContentResult.value));
  }

  public static createNoteContent(
    authorId: CuratorId,
    text: string
  ): Result<CardContent, CardContentValidationError> {
    const noteContentResult = NoteCardContent.create(authorId, text);
    if (noteContentResult.isErr()) {
      return err(
        new CardContentValidationError(noteContentResult.error.message)
      );
    }
    return ok(new CardContent(noteContentResult.value));
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
    const highlightContentResult = HighlightCardContent.create(
      text,
      selectors,
      options
    );
    if (highlightContentResult.isErr()) {
      return err(
        new CardContentValidationError(highlightContentResult.error.message)
      );
    }
    return ok(new CardContent(highlightContentResult.value));
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
      rangeSelector?: Omit<RangeSelector, "type">;
    }
  ): Result<CardContent, CardContentValidationError> {
    const highlightContentResult =
      HighlightCardContent.createWithHypothesisSelectors(
        text,
        exact,
        prefix,
        suffix,
        startPos,
        endPos,
        options
      );
    if (highlightContentResult.isErr()) {
      return err(
        new CardContentValidationError(highlightContentResult.error.message)
      );
    }
    return ok(new CardContent(highlightContentResult.value));
  }

  // Legacy create method for backward compatibility
  public static create(
    props: CreateCardProps
  ): Result<CardContent, CardContentValidationError> {
    switch (props.type) {
      case CardTypeEnum.URL:
        return CardContent.createUrlContent(props.url, props.metadata);

      case CardTypeEnum.NOTE:
        return CardContent.createNoteContent(props.authorId, props.text);

      default:
        return err(new CardContentValidationError("Invalid card content type"));
    }
  }
}
