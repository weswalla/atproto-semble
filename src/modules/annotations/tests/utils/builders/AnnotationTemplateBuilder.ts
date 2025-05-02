import { UniqueEntityID } from "../../../../../shared/domain/UniqueEntityID";
import { Result, ok, err } from "../../../../../shared/core/Result";
import {
  AnnotationTemplate,
  AnnotationTemplateProps,
} from "../../../domain/aggregates/AnnotationTemplate";
import {
  AnnotationTemplateName,
  AnnotationTemplateDescription,
  CuratorId,
  PublishedRecordId,
  AnnotationTemplateFields,
  AnnotationTemplateFieldInputDTO,
  AnnotationTemplateField,
  AnnotationFieldDescription,
  AnnotationFieldName,
  PublishedRecordIdProps,
} from "../../../domain/value-objects";
import { AnnotationField } from "../../../domain/aggregates";
import { AnnotationFieldDefinitionFactory } from "../../../domain/AnnotationFieldDefinitionFactory";
import { AnnotationType } from "../../../domain/value-objects/AnnotationType";

export class AnnotationTemplateBuilder {
  private _id?: UniqueEntityID;
  private _curatorId: string = "did:plc:defaultCurator";
  private _name: string = "Default Template Name";
  private _description: string = "Default template description.";
  private _fieldDTOs: AnnotationTemplateFieldInputDTO[] = [];
  private _annotationTemplateFields?: AnnotationTemplateFields;
  private _createdAt?: Date;
  private _publishedRecordId?: PublishedRecordIdProps;

  withId(id: UniqueEntityID): this {
    this._id = id;
    return this;
  }

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

  withCreatedAt(date: Date): this {
    this._createdAt = date;
    return this;
  }

  withPublishedRecordId(recordId: PublishedRecordIdProps): this {
    this._publishedRecordId = recordId;
    return this;
  }

  // Add a field to the template
  addField(field: AnnotationTemplateFieldInputDTO): this {
    this._fieldDTOs.push(field);
    return this;
  }

  // Add existing AnnotationTemplateFields
  withAnnotationTemplateFields(fields: AnnotationTemplateFields): this {
    this._annotationTemplateFields = fields;
    return this;
  }

  // Convenience methods for adding specific field types
  addDyadField(
    name: string,
    description: string,
    sideA: string,
    sideB: string,
    required = false
  ): this {
    this._fieldDTOs.push({
      name,
      description,
      type: "dyad",
      definition: { sideA, sideB },
      required,
    });
    return this;
  }

  addTriadField(
    name: string,
    description: string,
    vertexA: string,
    vertexB: string,
    vertexC: string,
    required = false
  ): this {
    this._fieldDTOs.push({
      name,
      description,
      type: "triad",
      definition: { vertexA, vertexB, vertexC },
      required,
    });
    return this;
  }

  addRatingField(name: string, description: string, required = false): this {
    this._fieldDTOs.push({
      name,
      description,
      type: "rating",
      definition: { numberOfStars: 5 },
      required,
    });
    return this;
  }

  addSingleSelectField(
    name: string,
    description: string,
    options: string[],
    required = false
  ): this {
    this._fieldDTOs.push({
      name,
      description,
      type: "singleSelect",
      definition: { options },
      required,
    });
    return this;
  }

  addMultiSelectField(
    name: string,
    description: string,
    options: string[],
    required = false
  ): this {
    this._fieldDTOs.push({
      name,
      description,
      type: "multiSelect",
      definition: { options },
      required,
    });
    return this;
  }

  // Add fields from AnnotationField objects
  withFields(fields: AnnotationField[], allRequired: boolean = false): this {
    // Create AnnotationTemplateField objects from AnnotationField objects
    const templateFields = fields.map((field) => {
      const templateFieldResult = AnnotationTemplateField.create({
        annotationField: field,
        required: allRequired,
      });

      if (templateFieldResult.isErr()) {
        throw new Error(
          `Failed to create template field: ${templateFieldResult.error}`
        );
      }

      return templateFieldResult.value;
    });

    // Create AnnotationTemplateFields from the array
    const fieldsResult = AnnotationTemplateFields.create(templateFields);

    if (fieldsResult.isErr()) {
      throw new Error(
        `Failed to create template fields: ${fieldsResult.error}`
      );
    }

    this._annotationTemplateFields = fieldsResult.value;
    return this;
  }

  // Method to build the AnnotationTemplate aggregate
  build(): Result<AnnotationTemplate> {
    const curatorIdResult = CuratorId.create(this._curatorId);
    const nameResult = AnnotationTemplateName.create(this._name);
    const descriptionResult = AnnotationTemplateDescription.create(
      this._description
    );

    if (curatorIdResult.isErr()) {
      return err(
        new Error(`CuratorId creation failed: ${curatorIdResult.error}`)
      );
    }
    if (nameResult.isErr()) {
      return err(
        new Error(`AnnotationTemplateName creation failed: ${nameResult.error}`)
      );
    }
    if (descriptionResult.isErr()) {
      return err(
        new Error(
          `AnnotationTemplateDescription creation failed: ${descriptionResult.error}`
        )
      );
    }

    // Determine which fields to use
    let fieldsResult: Result<AnnotationTemplateFields>;

    // If we have pre-built AnnotationTemplateFields, use those
    if (this._annotationTemplateFields) {
      fieldsResult = ok(this._annotationTemplateFields);
    }
    // Otherwise, create fields from DTOs if we have any
    else if (this._fieldDTOs.length > 0) {
      // Create fields directly instead of using createFromDto
      const annotationTemplateFields: AnnotationTemplateField[] = [];

      for (const fieldDto of this._fieldDTOs) {
        // Create the annotation field first
        const fieldType = AnnotationType.create(fieldDto.type);
        const nameResult = AnnotationFieldName.create(fieldDto.name);
        const descriptionResult = AnnotationFieldDescription.create(
          fieldDto.description
        );
        const definitionResult = AnnotationFieldDefinitionFactory.create({
          type: fieldType,
          fieldDefProps: fieldDto.definition,
        });

        if (nameResult.isErr()) {
          return err(
            new Error(`Field name creation failed: ${nameResult.error}`)
          );
        }

        if (descriptionResult.isErr()) {
          return err(
            new Error(
              `Field description creation failed: ${descriptionResult.error}`
            )
          );
        }

        if (definitionResult.isErr()) {
          return err(
            new Error(
              `Field definition creation failed: ${definitionResult.error}`
            )
          );
        }

        const fieldResult = AnnotationField.create({
          curatorId: curatorIdResult.value,
          name: nameResult.value,
          description: descriptionResult.value,
          definition: definitionResult.value,
        });

        if (fieldResult.isErr()) {
          return err(
            new Error(`Annotation field creation failed: ${fieldResult.error}`)
          );
        }

        // Create the template field with the annotation field
        const templateFieldResult = AnnotationTemplateField.create({
          annotationField: fieldResult.value,
          required: fieldDto.required || false,
        });

        if (templateFieldResult.isErr()) {
          return err(
            new Error(
              `Template field creation failed: ${templateFieldResult.error}`
            )
          );
        }

        annotationTemplateFields.push(templateFieldResult.value);
      }

      // Create the AnnotationTemplateFields value object
      fieldsResult = AnnotationTemplateFields.create(annotationTemplateFields);
    } else {
      // No fields provided
      return err(new Error("AnnotationTemplate must have at least one field"));
    }

    if (fieldsResult.isErr()) {
      return err(
        new Error(
          `AnnotationTemplateFields creation failed: ${fieldsResult.error}`
        )
      );
    }

    // Create published record ID if provided
    let publishedRecordId: PublishedRecordId | undefined;
    if (this._publishedRecordId) {
      publishedRecordId = PublishedRecordId.create(this._publishedRecordId);
    }

    const props: AnnotationTemplateProps = {
      curatorId: curatorIdResult.value,
      name: nameResult.value,
      description: descriptionResult.value,
      annotationTemplateFields: fieldsResult.value,
      createdAt: this._createdAt,
      publishedRecordId,
    };

    // Create the template
    const templateResult = AnnotationTemplate.create(props, this._id);

    if (templateResult.isErr()) {
      return err(
        new Error(`AnnotationTemplate creation failed: ${templateResult.error}`)
      );
    }

    return ok(templateResult.value);
  }

  // Convenience method to build and unwrap, throwing on error (useful in tests)
  buildOrThrow(): AnnotationTemplate {
    const result = this.build();
    if (result.isErr()) {
      throw result.error;
    }
    return result.value;
  }
}
