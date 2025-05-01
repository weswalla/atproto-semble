export class DID {
  // did:plc:lehcqqkwzcwvjvw66uthu5oq
  value: string;

  constructor(did: string) {
    this.value = did;
    if (!this.isValid()) {
      throw new Error("Invalid DID");
    }
  }

  isValid(): boolean {
    return this.value.startsWith("did:plc:");
  }

  toString(): string {
    return this.value;
  }
}
