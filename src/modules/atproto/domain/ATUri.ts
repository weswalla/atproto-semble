import { DID } from './DID';

export class ATUri {
  // at://did:plc:lehcqqkwzcwvjvw66uthu5oq/app.bsky.feed.post/3lnxh4zet5c2a
  // given the uri structure above, which is composed of did, CollectionNSID, and rkey, make a value object

  value: string;
  did: DID;
  collection: string;
  rkey: string;

  constructor(uri: string) {
    this.value = uri;
    const parts = uri.split('/');
    if (parts.length !== 5) {
      throw new Error('Invalid AT URI');
    }
    const didResult = DID.create(parts[2]!);
    if (didResult.isErr()) {
      throw new Error(`Invalid DID in AT URI: ${didResult.error.message}`);
    }
    this.did = didResult.value;
    this.collection = parts[3]!;
    this.rkey = parts[4]!;
  }
}
