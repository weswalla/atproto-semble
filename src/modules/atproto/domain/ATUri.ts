import { ValueObject } from '../../../shared/domain/ValueObject';
import { Result, ok, err } from '../../../shared/core/Result';
import { DID } from './DID';

export class InvalidATUriError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidATUriError';
  }
}

interface ATUriProps {
  value: string;
  did: DID;
  collection: string;
  rkey: string;
}

export class ATUri extends ValueObject<ATUriProps> {
  get value(): string {
    return this.props.value;
  }

  get did(): DID {
    return this.props.did;
  }

  get collection(): string {
    return this.props.collection;
  }

  get rkey(): string {
    return this.props.rkey;
  }

  private constructor(props: ATUriProps) {
    super(props);
  }

  public static create(uri: string): Result<ATUri, InvalidATUriError> {
    if (!uri || uri.trim().length === 0) {
      return err(new InvalidATUriError('AT URI cannot be empty'));
    }

    const trimmedUri = uri.trim();

    if (!trimmedUri.startsWith('at://')) {
      return err(new InvalidATUriError('AT URI must start with "at://"'));
    }

    const parts = trimmedUri.split('/');
    if (parts.length !== 5) {
      return err(
        new InvalidATUriError(
          'AT URI must have exactly 5 parts separated by "/"',
        ),
      );
    }

    const didResult = DID.create(parts[2]!);
    if (didResult.isErr()) {
      return err(
        new InvalidATUriError(
          `Invalid DID in AT URI: ${didResult.error.message}`,
        ),
      );
    }

    const collection = parts[3]!;
    const rkey = parts[4]!;

    if (!collection || collection.length === 0) {
      return err(new InvalidATUriError('Collection cannot be empty'));
    }

    if (!rkey || rkey.length === 0) {
      return err(new InvalidATUriError('Record key cannot be empty'));
    }

    return ok(
      new ATUri({
        value: trimmedUri,
        did: didResult.value,
        collection,
        rkey,
      }),
    );
  }

  public static fromParts(
    did: DID,
    collection: string,
    rkey: string,
  ): Result<ATUri, InvalidATUriError> {
    if (!collection || collection.length === 0) {
      return err(new InvalidATUriError('Collection cannot be empty'));
    }

    if (!rkey || rkey.length === 0) {
      return err(new InvalidATUriError('Record key cannot be empty'));
    }

    const uri = `at://${did.value}/${collection}/${rkey}`;

    return ok(
      new ATUri({
        value: uri,
        did,
        collection,
        rkey,
      }),
    );
  }

  public toString(): string {
    return this.props.value;
  }

  public equals(other: ATUri): boolean {
    return this.props.value === other.props.value;
  }

  public getEntityType(configService: any): AtUriResourceType {
    const collections = configService.getAtProtoCollections();
    if (this.collection === collections.card) return AtUriResourceType.CARD;
    if (this.collection === collections.collection) return AtUriResourceType.COLLECTION;
    if (this.collection === collections.collectionLink) return AtUriResourceType.COLLECTION_LINK;
    throw new Error(`Unknown collection type: ${this.collection}`);
  }
}

export enum AtUriResourceType {
  CARD = 'card',
  COLLECTION = 'collection',
  COLLECTION_LINK = 'collection_link',
}
