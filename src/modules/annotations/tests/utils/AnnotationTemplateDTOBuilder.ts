import { AnnotationTemplateFieldInputDTO } from '../../domain/value-objects';
import { CreateAndPublishAnnotationTemplateDTO } from '../../application/use-cases/CreateAndPublishAnnotationTemplateUseCase';

export class AnnotationTemplateDTOBuilder {
  private _curatorId: string = 'did:example:defaultCurator';
  private _name: string = 'Default Template Name';
  private _description: string = 'Default template description.';
  private _fields: AnnotationTemplateFieldInputDTO[] = [];

  withCuratorId(curatorId: string): this {
    this._curatorId = curatorId;
    return this;
  }

  withName(name: string): this {
    this._name = name;
    return this;
  }

  withDescription(description: string): this {
    this._description = description;
    return this;
  }

  addField(field: AnnotationTemplateFieldInputDTO): this {
    this._fields.push(field);
    return this;
  }

  // Optional: Add specific field type methods for convenience
  addDyadField(
    name: string,
    description: string,
    sideA: string,
    sideB: string,
    required = false,
  ): this {
    this._fields.push({
      name,
      description,
      type: 'dyad', // Assuming 'dyad' is the correct type string
      definition: { sideA, sideB },
      required,
    });
    return this;
  }

  // Add similar methods for triad, rating, select, etc. if needed

  build(): CreateAndPublishAnnotationTemplateDTO {
    // Basic validation
    if (this._fields.length === 0) {
      console.warn(
        'AnnotationTemplateDTOBuilder: Building template DTO with no fields.',
      );
    }

    return {
      curatorId: this._curatorId,
      name: this._name,
      description: this._description,
      fields: [...this._fields], // Return a copy of the fields array
    };
  }
}
