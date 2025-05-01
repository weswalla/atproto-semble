import { IAnnotationFieldPublisher } from "src/modules/annotations/application/ports/IAnnotationFieldPublisher";
import { AnnotationField } from "src/modules/annotations/domain/AnnotationField";
import { Result, ok, err } from "src/shared/core/Result";
import { UseCaseError } from "src/shared/core/UseCaseError";
import { PublishedRecordId } from "src/modules/annotations/domain/value-objects/PublishedRecordId";
import { BskyAgent } from "@atproto/api";
import { Record as AnnotationFieldRecord } from "./lexicon/types/app/annos/annotationField";
import { AppError } from "src/shared/core/AppError";
import { AnnotationType } from "src/modules/annotations/domain/value-objects/AnnotationType";

export class ATProtoAnnotationFieldPublisher
  implements IAnnotationFieldPublisher
{
  private agent: BskyAgent;
  private readonly COLLECTION = "app.annos.annotationField";

  constructor(agent: BskyAgent) {
    this.agent = agent;
  }

  /**
   * Maps an AnnotationField domain object to the AT Protocol record format
   */
  private mapToRecord(field: AnnotationField): AnnotationFieldRecord {
    const definition = this.mapDefinition(field);

    return {
      $type: "app.annos.annotationField",
      name: field.name.value,
      description: field.description.value,
      createdAt: field.createdAt.toISOString(),
      definition,
    };
  }

  /**
   * Maps the field definition from domain object to AT Protocol format
   */
  private mapDefinition(field: AnnotationField): any {
    const def = field.definition;
    const defType = def.type.value;

    switch (defType) {
      case AnnotationType.DYAD.value:
        return {
          $type: "app.annos.annotationField#dyadFieldDef",
          sideA: def.getSideA(),
          sideB: def.getSideB(),
        };
      case "triad":
        return {
          $type: "app.annos.annotationField#triadFieldDef",
          vertexA: def.getVertexA(),
          vertexB: def.getVertexB(),
          vertexC: def.getVertexC(),
        };
      case "rating":
        return {
          $type: "app.annos.annotationField#ratingFieldDef",
          numberOfStars: 5, // Fixed at 5 per the schema
        };
      case "singleSelect":
        return {
          $type: "app.annos.annotationField#singleSelectFieldDef",
          options: def.getOptions(),
        };
      case "multiSelect":
        return {
          $type: "app.annos.annotationField#multiSelectFieldDef",
          options: def.getOptions(),
        };
      default:
        throw new Error(`Unsupported field definition type: ${defType}`);
    }
  }

  /**
   * Publishes an AnnotationField to the AT Protocol
   */
  async publish(
    field: AnnotationField
  ): Promise<Result<PublishedRecordId, UseCaseError>> {
    try {
      const record = this.mapToRecord(field);
      const curatorDid = field.curatorId.value;

      // If the field is already published, update it
      if (field.isPublished()) {
        const uri = field.publishedRecordId!.getValue();
        const [repo, collection, rkey] = uri.split("/").slice(2);

        const updateResult = await this.agent.com.atproto.repo.putRecord({
          repo: curatorDid,
          collection: this.COLLECTION,
          rkey: rkey,
          record,
        });

        return ok(PublishedRecordId.create(uri));
      }
      // Otherwise create a new record
      else {
        const createResult = await this.agent.com.atproto.repo.createRecord({
          repo: curatorDid,
          collection: this.COLLECTION,
          record,
        });

        return ok(PublishedRecordId.create(createResult.data.uri));
      }
    } catch (error) {
      return err(AppError.UnexpectedError.create(error));
    }
  }

  /**
   * Unpublishes (deletes) an AnnotationField from the AT Protocol
   */
  async unpublish(
    recordId: PublishedRecordId
  ): Promise<Result<void, UseCaseError>> {
    try {
      const uri = recordId.getValue();
      const [repo, collection, rkey] = uri.split("/").slice(2);

      await this.agent.com.atproto.repo.deleteRecord({
        repo,
        collection: this.COLLECTION,
        rkey,
      });

      return ok(undefined);
    } catch (error) {
      return err(AppError.UnexpectedError.create(error));
    }
  }
}
