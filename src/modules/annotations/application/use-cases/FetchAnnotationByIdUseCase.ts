import { UseCase } from "../../../../shared/core/UseCase";
import { IAnnotationRepository } from "../repositories/IAnnotationRepository";
import { Result, ok, err } from "../../../../shared/core/Result";
import { AppError } from "../../../../shared/core/AppError";
import { AnnotationId } from "../../domain/value-objects";
import { AnnotationValueFormatter } from "../../domain/AnnotationValueFormatter";

export interface FetchAnnotationByIdDTO {
  annotationId: string;
}

export interface AnnotationDetailDTO {
  id: string;
  url: string;
  fieldName: string;
  fieldDescription: string;
  valueType: string;
  valueData: any;
  valuePreview: string;
  note?: string;
  createdAt: Date;
  curatorId: string;
  templateName?: string;
  publishedRecordId?: {
    uri: string;
    cid: string;
  };
}

export type FetchAnnotationByIdResponse = Result<
  AnnotationDetailDTO, // Success returns the complete annotation details
  AppError.NotFoundError | AppError.UnexpectedError
>;

export class FetchAnnotationByIdUseCase
  implements UseCase<FetchAnnotationByIdDTO, Promise<FetchAnnotationByIdResponse>>
{
  constructor(
    private readonly annotationRepository: IAnnotationRepository
  ) {}

  async execute(
    request: FetchAnnotationByIdDTO
  ): Promise<FetchAnnotationByIdResponse> {
    try {
      const annotationIdOrError = AnnotationId.createFromString(
        request.annotationId
      );

      if (annotationIdOrError.isErr()) {
        return err(
          new AppError.UnexpectedError(new Error("Invalid annotation ID format"))
        );
      }

      const annotationId = annotationIdOrError.value;
      const annotation = await this.annotationRepository.findById(annotationId);

      if (!annotation) {
        return err(new AppError.NotFoundError("Annotation not found"));
      }

      // Map domain object to DTO for the response
      const annotationDTO: AnnotationDetailDTO = {
        id: annotation.id.toString(),
        url: annotation.url.value,
        fieldName: annotation.annotationField.name.value,
        fieldDescription: annotation.annotationField.description.value,
        valueType: annotation.value.type.value,
        valueData: annotation.value.props,
        valuePreview: AnnotationValueFormatter.createPreview(annotation.value),
        note: annotation.note?.getValue(),
        createdAt: annotation.createdAt || new Date(),
        curatorId: annotation.curatorId.value,
        templateName: annotation.annotationTemplateIds && annotation.annotationTemplateIds.length > 0 
          ? "From template" // Ideally we'd fetch the template name
          : undefined,
        publishedRecordId: annotation.publishedRecordId
          ? {
              uri: annotation.publishedRecordId.uri,
              cid: annotation.publishedRecordId.cid,
            }
          : undefined,
      };

      return ok(annotationDTO);
    } catch (error: any) {
      return err(new AppError.UnexpectedError(error));
    }
  }
}
