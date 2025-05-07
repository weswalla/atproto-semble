import { UseCaseError } from "src/shared/core/UseCaseError";

export namespace RefreshAccessTokenErrors {
  export class InvalidRefreshTokenError extends UseCaseError {
    constructor() {
      super("Invalid or expired refresh token");
    }
  }
}
