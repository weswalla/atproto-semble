import { ValueObject } from "src/shared/domain/ValueObject";

export interface PublishedRecordIdProps {
  uri: string;
  cid: string;
}
export class PublishedRecordId extends ValueObject<PublishedRecordIdProps> {
  get uri(): string {
    return this.props.uri;
  }
  get cid(): string {
    return this.props.cid;
  }
  getValue(): PublishedRecordIdProps {
    return this.props;
  }

  private constructor(value: PublishedRecordIdProps) {
    super(value);
  }

  public static create(value: PublishedRecordIdProps): PublishedRecordId {
    if (!value.uri.startsWith("at://")) {
      throw new Error(`Invalid AT URI format: ${value}`);
    }
    return new PublishedRecordId(value);
  }
  public equals(vo?: ValueObject<PublishedRecordIdProps> | undefined): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    if (vo.props === undefined) {
      return false;
    }
    return this.props.uri === vo.props.uri && this.props.cid === vo.props.cid;
  }
}
