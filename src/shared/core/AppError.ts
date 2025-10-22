import { Err } from './Result';
import { UseCaseError } from './UseCaseError';

export namespace AppError {
  export class UnexpectedError extends UseCaseError {
    message: string;
    public constructor(err: any) {
      super(`An unexpected error occurred.`);
      console.log(`[AppError]: An unexpected error occurred`);
      console.error(err);
      this.message = err.toString ? err.toString() : JSON.stringify(err);
    }

    public static create(err: any): UnexpectedError {
      return new UnexpectedError(err);
    }
  }

  export class NotFoundError extends Err<any, UseCaseError> {
    public constructor(message: string) {
      super(Error(message));
      console.log(`[AppError]: ${message}`);
    }

    public static create(message: string): NotFoundError {
      return new NotFoundError(message);
    }
  }
}
