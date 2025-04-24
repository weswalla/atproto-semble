// Base Result types using discriminated union

/**
 * Represents a successful operation outcome.
 * Contains the successful value of type T.
 * E represents the potential error type for compatibility in the Result union.
 */
export class Ok<T, E> {
  public readonly value: T;

  constructor(value: T) {
    this.value = value;
  }

  /** Type guard indicating success */
  public isOk(): this is Ok<T, E> {
    return true;
  }

  /** Type guard indicating failure */
  public isErr(): this is Err<T, E> {
    return false;
  }

  public unwrap(): T {
    return this.value;
  }
}

/**
 * Represents a failed operation outcome.
 * Contains the error value of type E.
 * T represents the potential success type for compatibility in the Result union.
 */
export class Err<T, E> {
  public readonly error: E;

  constructor(error: E) {
    this.error = error;
  }

  /** Type guard indicating success */
  public isOk(): this is Ok<T, E> {
    return false;
  }

  /** Type guard indicating failure */
  public isErr(): this is Err<T, E> {
    return true;
  }

  public unwrap(): T {
    throw this.error;
  }
}

/**
 * Represents the outcome of an operation that can either succeed (Ok) or fail (Err).
 * @template T The type of the value in case of success.
 * @template E The type of the error in case of failure. Defaults to `Error`.
 */
export type Result<T, E = Error> = Ok<T, E> | Err<T, E>;

// Static factory functions

/**
 * Creates an Ok result containing the success value.
 * @param value The success value.
 */
export const ok = <T, E>(value: T): Ok<T, E> => new Ok(value);

/**
 * Creates an Err result containing the error value.
 * @param error The error value.
 */
export const err = <T, E>(error: E): Err<T, E> => new Err(error);

/**
 * Combines multiple Result instances. If all are Ok, returns an Ok result with an array of values.
 * If any Result is an Err, returns the first Err encountered.
 * Note: This basic version assumes all results have the same error type E.
 *       And collects values into an array T[].
 * @param results An array of Result instances.
 * @returns A single Result. Ok<T[], E> if all succeed, otherwise the first Err<any, E>.
 */
export const combine = <T, E>(results: Result<T, E>[]): Result<T[], E> => {
  const values: T[] = [];
  for (const result of results) {
    if (result.isErr()) {
      // If we find an error, return it immediately.
      // We cast the error result to Err<T[], E> for type compatibility.
      // The T[] part doesn't matter since it's an error state.
      return err<T[], E>(result.error);
    }
    // If it's Ok, collect the value
    values.push(result.value);
  }
  // If no errors were found, return an Ok with the collected values
  return ok<T[], E>(values);
};

// --- Either Type (kept separate for now) ---

export type Either<L, A> = Left<L, A> | Right<L, A>;

export class Left<L, A> {
  readonly value: L;

  constructor(value: L) {
    this.value = value;
  }

  isLeft(): this is Left<L, A> {
    return true;
  }

  isRight(): this is Right<L, A> {
    return false;
  }
}

export class Right<L, A> {
  readonly value: A;

  constructor(value: A) {
    this.value = value;
  }

  isLeft(): this is Left<L, A> {
    return false;
  }

  isRight(): this is Right<L, A> {
    return true;
  }
}

export const left = <L, A>(l: L): Either<L, A> => {
  return new Left(l);
};

export const right = <L, A>(a: A): Either<L, A> => {
  return new Right<L, A>(a);
};
