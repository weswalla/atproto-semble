import { UseCaseError } from 'src/shared/core/UseCaseError';

export namespace GenerateExtensionTokensErrors {
  export class TokenGenerationError extends UseCaseError {
    constructor(message?: string) {
      super(message || 'Failed to generate extension tokens');
    }
  }
}
