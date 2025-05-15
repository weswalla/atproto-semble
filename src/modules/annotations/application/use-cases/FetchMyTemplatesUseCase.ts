import { UseCase } from "../../../../shared/core/UseCase";
import { IAnnotationTemplateRepository } from "../repositories/IAnnotationTemplateRepository";
import { Result, ok, err } from "../../../../shared/core/Result";
import { AppError } from "../../../../shared/core/AppError";
import { CuratorId } from "../../domain/value-objects";

export interface FetchMyTemplatesDTO {
  curatorId: string;
}

export interface TemplateListItemDTO {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  fieldCount: number;
  publishedRecordId?: {
    uri: string;
    cid: string;
  };
}

export type FetchMyTemplatesResponse = Result<
  TemplateListItemDTO[], // Success returns array of template summaries
  AppError.UnexpectedError
>;

export class FetchMyTemplatesUseCase
  implements UseCase<FetchMyTemplatesDTO, Promise<FetchMyTemplatesResponse>>
{
  constructor(
    private readonly annotationTemplateRepository: IAnnotationTemplateRepository
  ) {}

  async execute(
    request: FetchMyTemplatesDTO
  ): Promise<FetchMyTemplatesResponse> {
    try {
      const curatorIdOrError = CuratorId.create(request.curatorId);
      
      if (curatorIdOrError.isErr()) {
        return err(new AppError.UnexpectedError(new Error("Invalid curator ID")));
      }
      
      const curatorId = curatorIdOrError.value;
      const templates = await this.annotationTemplateRepository.findByCuratorId(curatorId);
      
      // Map domain objects to DTOs for the response
      const templateDTOs: TemplateListItemDTO[] = templates.map(template => ({
        id: template.id.toString(),
        name: template.name.value,
        description: template.description.value,
        createdAt: template.createdAt,
        fieldCount: template.getAnnotationFields().length,
        publishedRecordId: template.publishedRecordId 
          ? {
              uri: template.publishedRecordId.uri,
              cid: template.publishedRecordId.cid
            }
          : undefined
      }));
      
      return ok(templateDTOs);
    } catch (error: any) {
      return err(new AppError.UnexpectedError(error));
    }
  }
}
