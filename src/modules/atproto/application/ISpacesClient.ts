import { Result } from 'src/shared/core/Result';
import { DID } from '../domain/DID';

export interface SpaceRecordRef {
  uri: string;
  cid: string;
}

/**
 * Abstraction over the AT Protocol permissioned-spaces XRPC surface
 * (com.atproto.space.* record operations and com.atproto.simplespace.*
 * space lifecycle).
 */
export interface ISpacesClient {
  /** Creates a space owned by `owner`; returns its at-uri (at://{did}/space/{type}/{skey}). */
  createSpace(
    owner: DID,
    type: string,
    skey: string,
  ): Promise<Result<{ uri: string }, Error>>;

  /** True if the space exists and is readable by `owner`. */
  spaceExists(owner: DID, spaceUri: string): Promise<Result<boolean, Error>>;

  deleteSpace(owner: DID, spaceUri: string): Promise<Result<void, Error>>;

  createRecord(input: {
    space: string;
    repo: DID;
    collection: string;
    record: Record<string, unknown>;
    rkey?: string;
  }): Promise<Result<SpaceRecordRef, Error>>;

  putRecord(input: {
    space: string;
    repo: DID;
    collection: string;
    rkey: string;
    record: Record<string, unknown>;
  }): Promise<Result<SpaceRecordRef, Error>>;

  deleteRecord(input: {
    space: string;
    repo: DID;
    collection: string;
    rkey: string;
  }): Promise<Result<void, Error>>;
}

export function buildSpaceUri(
  ownerDid: string,
  type: string,
  skey: string,
): string {
  return `at://${ownerDid}/space/${type}/${skey}`;
}

/**
 * Extracts the space at-uri from a space-scoped record at-uri.
 * Record uris inside a space are shaped
 * at://{did}/space/{type}/{skey}/{collectionNsid}/{rkey}; the space uri is the
 * at://{did}/space/{type}/{skey} prefix. Returns null for plain repo uris.
 */
export function extractSpaceUriFromRecordUri(uri: string): string | null {
  if (!uri.startsWith('at://')) return null;
  const segments = uri.slice('at://'.length).split('/');
  // [did, 'space', type, skey, ...record path]
  if (segments.length < 4 || segments[1] !== 'space') return null;
  return `at://${segments.slice(0, 4).join('/')}`;
}

/** 13-char sortable key for collection space skeys (TID-shaped). */
export function generateSpaceKey(): string {
  const chars = '234567abcdefghijklmnopqrstuvwxyz';
  const micros =
    BigInt(Date.now()) * 1000n + BigInt(Math.floor(Math.random() * 1000));
  let n = (micros << 10n) | BigInt(Math.floor(Math.random() * 1024));
  let out = '';
  for (let i = 0; i < 13; i++) {
    out = chars[Number(n & 31n)] + out;
    n >>= 5n;
  }
  return out;
}
