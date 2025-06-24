import { Collection, CollectionAccessType } from "../../../domain/Collection";
import { CollectionName } from "../../../domain/value-objects/CollectionName";
import { CollectionDescription } from "../../../domain/value-objects/CollectionDescription";
import { CuratorId } from "../../../../annotations/domain/value-objects/CuratorId";
import { PublishedRecordId } from "../../../domain/value-objects/PublishedRecordId";
import { UniqueEntityID } from "../../../../../shared/domain/UniqueEntityID";

export class CollectionBuilder {
  private _id?: UniqueEntityID;
  private _authorId: string = "did:plc:defaultAuthor";
  private _name: string = "Default Collection";
  private _description?: string;
  private _accessType: CollectionAccessType = CollectionAccessType.OPEN;
  private _collaborators: string[] = [];
  private _publishedRecordId?: PublishedRecordId;
  private _createdAt?: Date;
  private _updatedAt?: Date;

  withId(id: UniqueEntityID): CollectionBuilder {
    this._id = id;
    return this;
  }

  withAuthorId(authorId: string): CollectionBuilder {
    this._authorId = authorId;
    return this;
  }

  withName(name: string): CollectionBuilder {
    this._name = name;
    return this;
  }

  withDescription(description: string): CollectionBuilder {
    this._description = description;
    return this;
  }

  withAccessType(accessType: CollectionAccessType): CollectionBuilder {
    this._accessType = accessType;
    return this;
  }

  withCollaborators(collaborators: string[]): CollectionBuilder {
    this._collaborators = collaborators;
    return this;
  }

  withPublishedRecordId(publishedRecordId: {
    uri: string;
    cid: string;
  }): CollectionBuilder {
    this._publishedRecordId = PublishedRecordId.create(publishedRecordId);
    return this;
  }

  withCreatedAt(createdAt: Date): CollectionBuilder {
    this._createdAt = createdAt;
    return this;
  }

  withUpdatedAt(updatedAt: Date): CollectionBuilder {
    this._updatedAt = updatedAt;
    return this;
  }

  build(): Collection | Error {
    try {
      const authorIdResult = CuratorId.create(this._authorId);
      if (authorIdResult.isErr()) {
        return new Error(`Invalid author ID: ${authorIdResult.error.message}`);
      }

      const nameResult = CollectionName.create(this._name);
      if (nameResult.isErr()) {
        return new Error(
          `Invalid collection name: ${nameResult.error.message}`
        );
      }

      let description: CollectionDescription | undefined;
      if (this._description) {
        const descriptionResult = CollectionDescription.create(
          this._description
        );
        if (descriptionResult.isErr()) {
          return new Error(
            `Invalid collection description: ${descriptionResult.error.message}`
          );
        }
        description = descriptionResult.value;
      }

      const collaboratorIds = this._collaborators.map((collaborator) => {
        const collaboratorResult = CuratorId.create(collaborator);
        if (collaboratorResult.isErr()) {
          throw new Error(
            `Invalid collaborator ID: ${collaboratorResult.error.message}`
          );
        }
        return collaboratorResult.value;
      });

      const collectionResult = Collection.create(
        {
          authorId: authorIdResult.value,
          name: nameResult.value.toString(),
          description: description?.toString(),
          accessType: this._accessType,
          collaboratorIds: collaboratorIds,
          publishedRecordId: this._publishedRecordId,
          createdAt: this._createdAt ?? new Date(),
          updatedAt: this._updatedAt ?? new Date(),
        },
        this._id
      );

      if (collectionResult.isErr()) {
        return collectionResult.error;
      }

      const collection = collectionResult.value;

      // Set published record ID if provided
      if (this._publishedRecordId) {
        collection.markAsPublished(this._publishedRecordId);
      }

      return collection;
    } catch (error) {
      return error instanceof Error ? error : new Error(String(error));
    }
  }

  buildOrThrow(): Collection {
    const result = this.build();
    if (result instanceof Error) {
      throw result;
    }
    return result;
  }
}
