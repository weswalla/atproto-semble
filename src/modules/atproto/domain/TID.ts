import { TID as LexTID } from "@atproto/common"; // Using the official library for generation/validation

// Placeholder for TID Value Object
// Wraps the @atproto/common TID class for domain modeling purposes
export class TID {
  private readonly tid: LexTID;

  private constructor(tid: LexTID) {
    this.tid = tid;
  }

  public static fromString(str: string): TID {
    try {
      return new TID(LexTID.fromStr(str));
    } catch (e) {
      throw new Error(`Invalid TID format: ${str}`, { cause: e });
    }
  }

  public toString(): string {
    return this.tid.toString();
  }

  public equals(other: TID): boolean {
    return this.tid.toString() === other.tid.toString();
  }

  public static create(): TID {
    return new TID(LexTID.fromStr(Date.now().toString()));
  }
}
