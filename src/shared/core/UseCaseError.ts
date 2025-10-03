interface IUseCaseError extends Error {
  message: string;
}

export abstract class UseCaseError implements IUseCaseError {
  public readonly message: string;
  public name: string = 'UseCaseError';

  constructor(message: string) {
    this.message = message;
  }
  toString(): string {
    return `${this.constructor.name}: ${this.message}`;
  }
}
