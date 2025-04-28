import { AnnotationValueInput } from "../../../domain/AnnotationValueFactory";
import {
  AnnotationInput,
  CreateAndPublishAnnotationsFromTemplateDTO,
} from "../../../application/use-cases/CreateAndPublishAnnotationsFromTemplateUseCase";

export class AnnotationsFromTemplateDTOBuilder {
  private _curatorId: string = "did:example:defaultCurator";
  private _url: string = "https://example.com/resource";
  private _templateId: string = "default-template-id";
  private _annotations: AnnotationInput[] = [];

  withCuratorId(curatorId: string): this {
    this._curatorId = curatorId;
    return this;
  }

  withUrl(url: string): this {
    this._url = url;
    return this;
  }

  withTemplateId(templateId: string): this {
    this._templateId = templateId;
    return this;
  }

  addAnnotation(
    fieldId: string,
    type: string,
    value: AnnotationValueInput,
    note?: string
  ): this {
    this._annotations.push({
      annotationFieldId: fieldId,
      type,
      value,
      note,
    });
    return this;
  }

  build(): CreateAndPublishAnnotationsFromTemplateDTO {
    return {
      curatorId: this._curatorId,
      url: this._url,
      templateId: this._templateId,
      annotations: [...this._annotations],
    };
  }
}
