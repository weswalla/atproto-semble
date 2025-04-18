import { TID as LexTID } from '@atproto/common' // Using the official library for generation/validation

// Placeholder for TID Value Object
// Wraps the @atproto/common TID class for domain modeling purposes
export class TID {
  private readonly tid: LexTID

  private constructor(tid: LexTID) {
    this.tid = tid
  }

  public static fromString(str: string): TID {
    try {
      return new TID(LexTID.fromStr(str))
    } catch (e) {
      throw new Error(`Invalid TID format: ${str}`, { cause: e })
    }
  }

  public static create(clockid?: number): TID {
    // Clock ID should ideally be unique per PDS/generator instance
    // Using a random one here for simplicity, but should be configured
    const effectiveClockId = clockid ?? Math.floor(Math.random() * 1024)
    return new TID(LexTID.next(effectiveClockId))
  }

  public toString(): string {
    return this.tid.toString()
  }

  public equals(other: TID): boolean {
    return this.tid.toString() === other.tid.toString()
  }
}
