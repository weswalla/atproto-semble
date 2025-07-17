import { UseCaseError } from 'src/shared/core/UseCaseError';

export namespace CompleteOAuthSignInErrors {
  export class InvalidCallbackParamsError extends UseCaseError {
    constructor() {
      super('The OAuth callback parameters are invalid or missing');
    }
  }

  export class AuthenticationFailedError extends UseCaseError {
    constructor(message: string = 'Authentication failed') {
      super(message);
    }
  }

  export class TokenGenerationError extends UseCaseError {
    constructor(message: string = 'Failed to generate authentication tokens') {
      super(message);
    }
  }
}
