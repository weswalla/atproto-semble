export type GuardResponse = string; // This remains the type for the error message

import { Result, ok, err } from "./Result"; // Import ok and err factories

export interface IGuardArgument {
  argument: any;
  argumentName: string;
}

export type GuardArgumentCollection = IGuardArgument[];

// Define the specific Result type used by Guard functions
// Success holds `void` (or `undefined`), Error holds the message string
type GuardResult = Result<void, GuardResponse>;

export class Guard {
  // Combine function now expects GuardResult[] and returns GuardResult
  public static combine(guardResults: GuardResult[]): GuardResult {
    for (const result of guardResults) {
      // Use the isErr type guard
      if (result.isErr()) {
        // Return the first error encountered
        return result; // No need to cast, it's already Err<void, GuardResponse>
      }
    }
    // If all results are Ok, return a single Ok
    return ok(undefined); // Success case carries no value
  }

  public static greaterThan(
    minValue: number,
    actualValue: number
  ): GuardResult {
    return actualValue > minValue
      ? ok(undefined) // Use ok factory
      : err(`Number given {${actualValue}} is not greater than {${minValue}}`); // Use err factory
  }

  public static againstAtLeast(numChars: number, text: string): GuardResult {
    return text.length >= numChars
      ? ok(undefined) // Use ok factory
      : err(`Text is not at least ${numChars} chars.`); // Use err factory
  }

  public static againstAtMost(numChars: number, text: string): GuardResult {
    return text.length <= numChars
      ? ok(undefined) // Use ok factory
      : err(`Text is greater than ${numChars} chars.`); // Use err factory
  }

  public static againstNullOrUndefined(
    argument: any,
    argumentName: string
  ): GuardResult {
    if (argument === null || argument === undefined) {
      return err(`${argumentName} is null or undefined`); // Use err factory
    } else {
      return ok(undefined); // Use ok factory
    }
  }

  public static againstNullOrUndefinedBulk(
    args: GuardArgumentCollection
  ): GuardResult {
    for (const arg of args) {
      const result = this.againstNullOrUndefined(
        arg.argument,
        arg.argumentName
      );
      // Use the isErr type guard
      if (result.isErr()) {
        return result; // Return the Err result directly
      }
    }
    // If loop completes, all arguments were valid
    return ok(undefined); // Use ok factory
  }

  public static isOneOf(
    value: any,
    validValues: any[],
    argumentName: string
  ): GuardResult {
    let isValid = false;
    for (const validValue of validValues) {
      if (value === validValue) {
        isValid = true;
      }
    }

    if (isValid) {
      return ok(undefined); // Use ok factory
    } else {
      // Use err factory
      return err(
        `${argumentName} isn't oneOf the correct types in ${JSON.stringify(
          validValues
        )}. Got "${value}".`
      );
    }
  }

  public static inRange(
    num: number,
    min: number,
    max: number,
    argumentName: string
  ): GuardResult {
    const isInRange = num >= min && num <= max;
    if (!isInRange) {
      // Use err factory
      return err(`${argumentName} is not within range ${min} to ${max}.`);
    } else {
      return ok(undefined); // Use ok factory
    }
  }

  public static allInRange(
    numbers: number[],
    min: number,
    max: number,
    argumentName: string
  ): GuardResult {
    for (const num of numbers) {
      const numIsInRangeResult = this.inRange(num, min, max, argumentName);
      // Use isErr type guard
      if (numIsInRangeResult.isErr()) {
        // Return the specific error from inRange
        return err(
          `${argumentName} is not within the range. Failed value: ${num}`
        ); // Or return numIsInRangeResult directly
      }
    }
    // If loop completes, all numbers are in range
    return ok(undefined); // Use ok factory
  }
}
