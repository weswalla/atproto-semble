import { ValueObject } from "src/shared/domain/ValueObject";

export class PublishedRecordId extends ValueObject<{ value: string }> {
  getValue(): string {
    return this.props.value;
  }

  private constructor(value: string) {
    super({ value });
  }

  public static create(value: string): PublishedRecordId {
    if (!value.startsWith("at://")) {
      throw new Error(`Invalid AT URI format: ${value}`);
    }
    return new PublishedRecordId(value);
  }
}
