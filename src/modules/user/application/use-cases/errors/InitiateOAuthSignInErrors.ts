import { UseCaseError } from "src/shared/core/UseCaseError";

export namespace InitiateOAuthSignInErrors {
  export class InvalidHandleError extends UseCaseError {
    constructor(message: string) {
      super(`Invalid handle format: ${message}`);
    }
  }
}
