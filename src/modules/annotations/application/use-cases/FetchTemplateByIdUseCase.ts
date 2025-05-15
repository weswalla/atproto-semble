import { UseCase } from "../../../../shared/core/UseCase";
import { IAnnotationTemplateRepository } from "../repositories/IAnnotationTemplateRepository";
import { Result, ok, err } from "../../../../shared/core/Result";
import { AppError } from "../../../../shared/core/AppError";
import { AnnotationTemplateId } from "../../domain/value-objects";

export interface FetchTemplateByIdDTO {
  templateId: string;
}

export interface AnnotationFieldDTO {
  id: string;
  name: string;
  description: string;
  required: boolean;
  definitionType: string;
  definition: any; // The specific definition depends on the field type
}

export interface TemplateDetailDTO {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  curatorId: string;
  fields: AnnotationFieldDTO[];
  publishedRecordId?: {
    uri: string;
    cid: string;
  };
}

export type FetchTemplateByIdResponse = Result<
  TemplateDetailDTO, // Success returns the complete template with fields
  AppError.NotFoundError | AppError.UnexpectedError
>;

export class FetchTemplateByIdUseCase
  implements UseCase<FetchTemplateByIdDTO, Promise<FetchTemplateByIdResponse>>
{
  constructor(
    private readonly annotationTemplateRepository: IAnnotationTemplateRepository
  ) {}

  async execute(
    request: FetchTemplateByIdDTO
  ): Promise<FetchTemplateByIdResponse> {
    try {
      const templateIdOrError = AnnotationTemplateId.createFromString(
        request.templateId
      );
      
      if (templateIdOrError.isErr()) {
        return err(new AppError.UnexpectedError(new Error("Invalid template ID format")));
      }
      
      const templateId = templateIdOrError.value;
      const template = await this.annotationTemplateRepository.findById(templateId);
      
      if (!template) {
        return err(new AppError.NotFoundError("Template not found"));
      }
      
      // Map domain object to DTO for the response
      const fields = template.getAnnotationFields().map(field => ({
        id: field.fieldId.getStringValue(),
        name: field.name.value,
        description: field.description.value,
        required: template.isFieldRequired(field.fieldId),
        definitionType: field.definition.type.value,
        definition: field.definition.getProps(),
      }));
      
      const templateDTO: TemplateDetailDTO = {
        id: template.id.toString(),
        name: template.name.value,
        description: template.description.value,
        createdAt: template.createdAt,
        curatorId: template.curatorId.value,
        fields: fields,
        publishedRecordId: template.publishedRecordId 
          ? {
              uri: template.publishedRecordId.uri,
              cid: template.publishedRecordId.cid
            }
          : undefined
      };
      
      return ok(templateDTO);
    } catch (error: any) {
      return err(new AppError.UnexpectedError(error));
    }
  }
}
