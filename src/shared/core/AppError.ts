import { Err } from "./Result";
import { UseCaseError } from "./UseCaseError";

export namespace AppError {
  export class UnexpectedError extends Err<any, UseCaseError> {
    message: string;
    public constructor(err: any) {
      super(Error(`An unexpected error occurred.`));
      console.log(`[AppError]: An unexpected error occurred`);
      console.error(err);
      this.message = JSON.stringify(err);
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
