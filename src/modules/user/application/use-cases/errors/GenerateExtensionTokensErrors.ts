import { Result, err } from 'src/shared/core/Result';
import { UseCaseError } from 'src/shared/core/UseCaseError';

export namespace GenerateExtensionTokensErrors {
  export class TokenGenerationError extends Result<UseCaseError> {
    constructor(message?: string) {
      super(false, {
        message: message || 'Failed to generate extension tokens',
      } as UseCaseError);
    }
  }
}
