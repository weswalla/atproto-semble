import { ValueObject } from '../../../shared/domain/ValueObject';
import { Result, ok, err } from '../../../shared/core/Result';
import { ATUri } from './ATUri';
import { DID } from './DID';
import type { CommitEvt, Create, Update, Delete } from '@atproto/sync';
import type { RepoRecord } from '@atproto/lexicon';
import type { CID } from 'multiformats/cid';

export class InvalidFirehoseEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidFirehoseEventError';
  }
}

export type FirehoseEventType = 'create' | 'update' | 'delete';

interface FirehoseEventProps {
  atUri: ATUri;
  did: DID;
  eventType: FirehoseEventType;
  cid: string | null;
  record?: RepoRecord;
  seq: number;
  time: string;
  rev: string;
}

export class FirehoseEvent extends ValueObject<FirehoseEventProps> {
  get atUri(): ATUri {
    return this.props.atUri;
  }

  get did(): DID {
    return this.props.did;
  }

  get eventType(): FirehoseEventType {
    return this.props.eventType;
  }

  get cid(): string | null {
    return this.props.cid;
  }

  get record(): RepoRecord | undefined {
    return this.props.record;
  }

  get seq(): number {
    return this.props.seq;
  }

  get time(): string {
    return this.props.time;
  }

  get rev(): string {
    return this.props.rev;
  }

  get collection(): string {
    return this.props.atUri.collection;
  }

  get rkey(): string {
    return this.props.atUri.rkey;
  }

  private constructor(props: FirehoseEventProps) {
    super(props);
  }

  public static fromCommitEvent(
    commitEvt: CommitEvt,
  ): Result<FirehoseEvent, InvalidFirehoseEventError> {
    try {
      // Parse the AT URI
      const atUriResult = ATUri.create(commitEvt.uri.toString());
      if (atUriResult.isErr()) {
        return err(
          new InvalidFirehoseEventError(
            `Invalid AT URI: ${atUriResult.error.message}`,
          ),
        );
      }

      // Parse the DID
      const didResult = DID.create(commitEvt.did);
      if (didResult.isErr()) {
        return err(
          new InvalidFirehoseEventError(
            `Invalid DID: ${didResult.error.message}`,
          ),
        );
      }

      // Extract CID and record based on event type
      let cid: string | null = null;
      let record: RepoRecord | undefined = undefined;

      if (commitEvt.event === 'create' || commitEvt.event === 'update') {
        const createOrUpdateEvt = commitEvt as Create | Update;
        cid = createOrUpdateEvt.cid.toString();
        record = createOrUpdateEvt.record;
      }

      return ok(
        new FirehoseEvent({
          atUri: atUriResult.value,
          did: didResult.value,
          eventType: commitEvt.event,
          cid,
          record,
          seq: commitEvt.seq,
          time: commitEvt.time,
          rev: commitEvt.rev,
        }),
      );
    } catch (error) {
      return err(
        new InvalidFirehoseEventError(
          `Failed to create FirehoseEvent: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ),
      );
    }
  }

  public isCreate(): boolean {
    return this.props.eventType === 'create';
  }

  public isUpdate(): boolean {
    return this.props.eventType === 'update';
  }

  public isDelete(): boolean {
    return this.props.eventType === 'delete';
  }

  public hasRecord(): boolean {
    return this.props.record !== undefined;
  }

  public toString(): string {
    return `FirehoseEvent(${this.props.eventType}, ${this.props.atUri.value})`;
  }
}
