import { ok, err, Result } from 'src/shared/core/Result';
import {
  ISpacesClient,
  SpaceRecordRef,
  buildSpaceUri,
} from '../../application/ISpacesClient';
import { DID } from '../../domain/DID';

interface StoredRecord {
  uri: string;
  cid: string;
  repo: string;
  collection: string;
  rkey: string;
  record: Record<string, unknown>;
}

export class FakeSpacesClient implements ISpacesClient {
  private spaces = new Map<string, StoredRecord[]>(); // spaceUri -> records
  private deletedSpaces: string[] = [];
  private shouldFail = false;
  private rkeyCounter = 0;

  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  private fail<T>(): Result<T, Error> {
    return err(new Error('Simulated spaces failure'));
  }

  async createSpace(
    owner: DID,
    type: string,
    skey: string,
  ): Promise<Result<{ uri: string }, Error>> {
    if (this.shouldFail) return this.fail();
    const uri = buildSpaceUri(owner.value, type, skey);
    if (!this.spaces.has(uri)) this.spaces.set(uri, []);
    return ok({ uri });
  }

  async spaceExists(
    _owner: DID,
    spaceUri: string,
  ): Promise<Result<boolean, Error>> {
    if (this.shouldFail) return this.fail();
    return ok(this.spaces.has(spaceUri));
  }

  async deleteSpace(
    _owner: DID,
    spaceUri: string,
  ): Promise<Result<void, Error>> {
    if (this.shouldFail) return this.fail();
    this.spaces.delete(spaceUri);
    this.deletedSpaces.push(spaceUri);
    return ok(undefined);
  }

  async createRecord(input: {
    space: string;
    repo: DID;
    collection: string;
    record: Record<string, unknown>;
    rkey?: string;
  }): Promise<Result<SpaceRecordRef, Error>> {
    if (this.shouldFail) return this.fail();
    const records = this.spaces.get(input.space);
    if (!records) return err(new Error(`SpaceNotFound: ${input.space}`));
    const rkey = input.rkey ?? `fake-rkey-${++this.rkeyCounter}`;
    const stored: StoredRecord = {
      uri: `${input.space}/${input.collection}/${rkey}`,
      cid: `fake-space-cid-${++this.rkeyCounter}`,
      repo: input.repo.value,
      collection: input.collection,
      rkey,
      record: input.record,
    };
    records.push(stored);
    return ok({ uri: stored.uri, cid: stored.cid });
  }

  async putRecord(input: {
    space: string;
    repo: DID;
    collection: string;
    rkey: string;
    record: Record<string, unknown>;
  }): Promise<Result<SpaceRecordRef, Error>> {
    if (this.shouldFail) return this.fail();
    const records = this.spaces.get(input.space);
    if (!records) return err(new Error(`SpaceNotFound: ${input.space}`));
    const existing = records.find(
      (r) => r.collection === input.collection && r.rkey === input.rkey,
    );
    if (existing) {
      existing.record = input.record;
      existing.cid = `fake-space-cid-${++this.rkeyCounter}`;
      return ok({ uri: existing.uri, cid: existing.cid });
    }
    return this.createRecord(input);
  }

  async deleteRecord(input: {
    space: string;
    repo: DID;
    collection: string;
    rkey: string;
  }): Promise<Result<void, Error>> {
    if (this.shouldFail) return this.fail();
    const records = this.spaces.get(input.space);
    if (!records) return err(new Error(`SpaceNotFound: ${input.space}`));
    this.spaces.set(
      input.space,
      records.filter(
        (r) => !(r.collection === input.collection && r.rkey === input.rkey),
      ),
    );
    return ok(undefined);
  }

  // Inspection helpers for tests
  getRecords(spaceUri: string): StoredRecord[] {
    return this.spaces.get(spaceUri) ?? [];
  }

  getDeletedSpaces(): string[] {
    return this.deletedSpaces;
  }

  clear(): void {
    this.spaces.clear();
    this.deletedSpaces = [];
    this.shouldFail = false;
    this.rkeyCounter = 0;
  }
}
