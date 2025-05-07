import { ValueObject } from "src/shared/domain/ValueObject";
import { err, ok, Result } from "src/shared/core/Result";

interface HandleProps {
  value: string;
}

export class Handle extends ValueObject<HandleProps> {
  get value(): string {
    return this.props.value;
  }

  private constructor(props: HandleProps) {
    super(props);
  }

  public static create(handle: string): Result<Handle> {
    // Basic handle validation - can be enhanced
    if (!handle || !handle.includes(".")) {
      return err(new Error("Invalid handle format. Must include a domain (e.g., user.bsky.social)"));
    }

    return ok(new Handle({ value: handle }));
  }

  public toString(): string {
    return this.props.value;
  }
}
