import { UseCase } from "../../../../shared/core/UseCase";
import { IAnnotationRepository } from "../repositories/IAnnotationRepository";
import { Result, ok, err } from "../../../../shared/core/Result";
import { AppError } from "../../../../shared/core/AppError";
import { CuratorId } from "../../domain/value-objects";
import { AnnotationType } from "../../domain/value-objects/AnnotationType";

export interface FetchMyAnnotationsDTO {
  curatorId: string;
}

export interface AnnotationListItemDTO {
  id: string;
  url: string;
  fieldName: string;
  valueType: string;
  valuePreview: string;
  createdAt: Date;
  templateName?: string;
  publishedRecordId?: {
    uri: string;
    cid: string;
  };
}

export type FetchMyAnnotationsResponse = Result<
  AnnotationListItemDTO[], // Success returns array of annotation summaries
  AppError.UnexpectedError
>;

export class FetchMyAnnotationsUseCase
  implements UseCase<FetchMyAnnotationsDTO, Promise<FetchMyAnnotationsResponse>>
{
  constructor(private readonly annotationRepository: IAnnotationRepository) {}

  async execute(
    request: FetchMyAnnotationsDTO
  ): Promise<FetchMyAnnotationsResponse> {
    try {
      const curatorIdOrError = CuratorId.create(request.curatorId);

      if (curatorIdOrError.isErr()) {
        return err(
          new AppError.UnexpectedError(new Error("Invalid curator ID"))
        );
      }

      const curatorId = curatorIdOrError.value;

      // We need to add a method to the repository to find annotations by curator ID
      const annotations =
        await this.annotationRepository.findByCuratorId(curatorId);

      // Map domain objects to DTOs for the response
      const annotationDTOs: AnnotationListItemDTO[] = annotations.map(
        (annotation) => {
          // Create a preview of the value based on its type
          let valuePreview = "";
          const value = annotation.value;

          switch (value.type.value) {
            case AnnotationType.DYAD.value:
              valuePreview = `Value: ${value}`;
              break;
            case "triad":
              valuePreview = `Values: ${value}, ${value}, ${value}`;
              break;
            case "rating":
              valuePreview = `Rating: ${value}`;
              break;
            case "singleSelect":
              valuePreview = `Selected: ${value}`;
              break;
            case "multiSelect":
              valuePreview = `Selected: ${value}`;
              break;
            default:
              valuePreview = "Custom value";
          }

          return {
            id: annotation.id.toString(),
            url: annotation.url.value,
            fieldName: annotation.annotationField.name.value,
            valueType: value.type.value,
            valuePreview,
            createdAt: annotation.createdAt || new Date(),
            templateName:
              annotation.annotationTemplateIds &&
              annotation.annotationTemplateIds.length > 0
                ? "From template" // Ideally we'd fetch the template name
                : undefined,
            publishedRecordId: annotation.publishedRecordId
              ? {
                  uri: annotation.publishedRecordId.uri,
                  cid: annotation.publishedRecordId.cid,
                }
              : undefined,
          };
        }
      );

      return ok(annotationDTOs);
    } catch (error: any) {
      return err(new AppError.UnexpectedError(error));
    }
  }
}
