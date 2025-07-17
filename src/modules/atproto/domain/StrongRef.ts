import { ValueObject } from 'src/shared/domain/ValueObject';
import { ATUri } from './ATUri';

interface StrongRefProps {
  uri: string;
  cid: string;
}
export class StrongRef extends ValueObject<StrongRefProps> {
  readonly $type = 'com.atproto.repo.strongRef';

  private readonly _atUri: ATUri;

  get atUri(): ATUri {
    return this._atUri;
  }

  get cid(): string {
    return this.props.cid;
  }

  getValue(): StrongRefProps {
    return this.props;
  }

  constructor(props: StrongRefProps) {
    super(props);
    this._atUri = new ATUri(props.uri);
  }

  equals(other: StrongRef): boolean {
    return (
      this.props.cid === other.props.cid && this.props.uri === other.props.uri
    );
  }
}
