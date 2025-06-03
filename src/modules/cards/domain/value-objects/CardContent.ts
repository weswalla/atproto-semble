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

interface HighlightCardContentProps extends BaseCardContentProps {
  type: CardTypeEnum.HIGHLIGHT;
  text: string;
  context?: string; // Surrounding text for context
  startOffset?: number;
  endOffset?: number;
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
    context?: string, 
    startOffset?: number, 
    endOffset?: number
  ): Result<CardContent, CardContentValidationError> {
    if (!text || text.trim().length === 0) {
      return err(new CardContentValidationError("Highlight text cannot be empty"));
    }

    if (text.length > 5000) {
      return err(new CardContentValidationError("Highlight text cannot exceed 5,000 characters"));
    }

    if (startOffset !== undefined && endOffset !== undefined && startOffset >= endOffset) {
      return err(new CardContentValidationError("Start offset must be less than end offset"));
    }

    return ok(new CardContent({
      type: CardTypeEnum.HIGHLIGHT,
      text: text.trim(),
      context: context?.trim(),
      startOffset,
      endOffset
    }));
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
          highlightProps.context, 
          highlightProps.startOffset, 
          highlightProps.endOffset
        );
      
      default:
        return err(new CardContentValidationError("Invalid card content type"));
    }
  }
}
