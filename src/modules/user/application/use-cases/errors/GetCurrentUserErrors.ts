import { UseCaseError } from 'src/shared/core/UseCaseError';

export namespace GetCurrentUserErrors {
  export class UserNotFoundError extends UseCaseError {
    constructor() {
      super('User not found');
    }
  }
}
