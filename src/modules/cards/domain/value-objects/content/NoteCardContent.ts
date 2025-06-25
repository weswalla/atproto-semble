import { ValueObject } from "../../../../../shared/domain/ValueObject";
import { ok, err, Result } from "../../../../../shared/core/Result";
import { CardTypeEnum } from "../CardType";
import { CuratorId } from "src/modules/annotations/domain/value-objects";

export class NoteCardContentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NoteCardContentValidationError";
  }
}

interface NoteCardContentProps {
  type: CardTypeEnum.NOTE;
  text: string;
  authorId: CuratorId;
}

export class NoteCardContent extends ValueObject<NoteCardContentProps> {
  public static readonly MAX_TEXT_LENGTH = 10000;

  get type(): CardTypeEnum.NOTE {
    return this.props.type;
  }

  get text(): string {
    return this.props.text;
  }

  get title(): string | undefined {
    // For backward compatibility, we don't store title separately in the new model
    return undefined;
  }

  private constructor(props: NoteCardContentProps) {
    super(props);
  }

  public static create(
    authorId: CuratorId,
    text: string
  ): Result<NoteCardContent, NoteCardContentValidationError> {
    if (!text || text.trim().length === 0) {
      return err(
        new NoteCardContentValidationError("Note text cannot be empty")
      );
    }

    if (text.length > this.MAX_TEXT_LENGTH) {
      return err(
        new NoteCardContentValidationError(
          `Note text cannot exceed ${this.MAX_TEXT_LENGTH} characters`
        )
      );
    }

    return ok(
      new NoteCardContent({
        type: CardTypeEnum.NOTE,
        text: text.trim(),
        authorId,
      })
    );
  }

  public updateText(
    newText: string
  ): Result<NoteCardContent, NoteCardContentValidationError> {
    if (!newText || newText.trim().length === 0) {
      return err(
        new NoteCardContentValidationError("Note text cannot be empty")
      );
    }

    if (newText.length > NoteCardContent.MAX_TEXT_LENGTH) {
      return err(
        new NoteCardContentValidationError(
          `Note text cannot exceed ${NoteCardContent.MAX_TEXT_LENGTH} characters`
        )
      );
    }

    return ok(
      new NoteCardContent({
        ...this.props,
        text: newText.trim(),
      })
    );
  }
}
