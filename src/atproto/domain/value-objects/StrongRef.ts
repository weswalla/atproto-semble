// Placeholder for StrongRef Value Object (com.atproto.repo.strongRef)
export class StrongRef {
  readonly $type = 'com.atproto.repo.strongRef'
  readonly cid: string
  readonly uri: string // AT URI

  constructor(cid: string, uri: string) {
    if (!cid || cid.trim().length === 0) {
      throw new Error('StrongRef CID cannot be empty.')
    }
    // Basic AT-URI check (can be enhanced)
    if (!uri || !uri.startsWith('at://') || !/at:\/\/[a-zA-Z0-9.-]+\/[a-zA-Z0-9.]+\/[a-zA-Z0-9]+/.test(uri)) {
       throw new Error(`Invalid AT URI format for StrongRef: ${uri}`)
    }

    this.cid = cid
    this.uri = uri
  }

  equals(other: StrongRef): boolean {
    return this.cid === other.cid && this.uri === other.uri
  }

  toString(): string {
    return this.uri;
  }
}
