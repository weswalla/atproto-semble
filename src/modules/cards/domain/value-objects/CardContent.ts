import { ValueObject } from '../../../../shared/domain/ValueObject';
import { CardTypeEnum } from './CardType';
import { ok, err, Result } from '../../../../shared/core/Result';
import { UrlMetadata } from './UrlMetadata';
import { URL } from './URL';
import { UrlCardContent } from './content/UrlCardContent';
import { NoteCardContent } from './content/NoteCardContent';
import { CuratorId } from './CuratorId';

// Union type for all card content types
type CardContentUnion = UrlCardContent | NoteCardContent;

export class CardContentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CardContentValidationError';
  }
}

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

  private constructor(content: CardContentUnion) {
    super({ content });
  }

  // Factory methods that delegate to specific content classes
  public static createUrlContent(
    url: URL,
    metadata?: UrlMetadata,
  ): Result<CardContent, CardContentValidationError> {
    const urlContentResult = UrlCardContent.create(url, metadata);
    if (urlContentResult.isErr()) {
      return err(
        new CardContentValidationError(urlContentResult.error.message),
      );
    }
    return ok(new CardContent(urlContentResult.value));
  }

  public static createNoteContent(
    text: string,
    curatorId: CuratorId,
  ): Result<CardContent, CardContentValidationError> {
    // Use provided curatorId or create a dummy one for backward compatibility
    const authorId = curatorId;
    const noteContentResult = NoteCardContent.create(authorId, text);
    if (noteContentResult.isErr()) {
      return err(
        new CardContentValidationError(noteContentResult.error.message),
      );
    }
    return ok(new CardContent(noteContentResult.value));
  }
}
