import { ValueObject } from '../../../../../shared/domain/ValueObject';
import { ok, err, Result } from '../../../../../shared/core/Result';
import { CardTypeEnum } from '../CardType';
import { UrlMetadata } from '../UrlMetadata';
import { URL } from '../URL';

export class UrlCardContentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UrlCardContentValidationError';
  }
}

interface UrlCardContentProps {
  type: CardTypeEnum.URL;
  url: URL;
  metadata?: UrlMetadata;
}

export class UrlCardContent extends ValueObject<UrlCardContentProps> {
  get type(): CardTypeEnum.URL {
    return this.props.type;
  }

  get url(): URL {
    return this.props.url;
  }

  get metadata(): UrlMetadata | undefined {
    return this.props.metadata;
  }

  private constructor(props: UrlCardContentProps) {
    super(props);
  }

  public static create(
    url: URL,
    metadata?: UrlMetadata,
  ): Result<UrlCardContent, UrlCardContentValidationError> {
    return ok(
      new UrlCardContent({
        type: CardTypeEnum.URL,
        url,
        metadata,
      }),
    );
  }

  public updateMetadata(metadata: UrlMetadata): UrlCardContent {
    return new UrlCardContent({
      ...this.props,
      metadata,
    });
  }
}
