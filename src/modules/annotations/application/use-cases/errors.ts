import { Result } from "src/shared/core/Result";
import { UseCaseError } from "src/shared/core/UseCaseError";

export namespace UpdateAnnotationErrors {
  export class InvalidValueTypeError extends Result<UseCaseError> {
    constructor() {
      super(false, {
        message:
          "You can only update an annotation value with the same type of value.",
      } as UseCaseError);
    }
  }
}
