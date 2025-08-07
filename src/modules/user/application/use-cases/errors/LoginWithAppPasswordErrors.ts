import { UseCaseError } from 'src/shared/core/UseCaseError';

export namespace LoginWithAppPasswordErrors {
  export class InvalidCredentialsError extends UseCaseError {
    constructor() {
      super('Invalid identifier or app password');
    }
  }

  export class AuthenticationFailedError extends UseCaseError {
    constructor(message: string) {
      super(`Authentication failed: ${message}`);
    }
  }

  export class TokenGenerationError extends UseCaseError {
    constructor(message: string) {
      super(`Token generation failed: ${message}`);
    }
  }
}
