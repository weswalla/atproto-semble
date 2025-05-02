import { UniqueEntityID } from "../../../../../shared/domain/UniqueEntityID";
import { AnnotationTemplate } from "../../../domain/aggregates/AnnotationTemplate";
import {
  AnnotationTemplateName,
  AnnotationTemplateDescription,
  CuratorId,
  PublishedRecordId,
  AnnotationTemplateFields,
  AnnotationTemplateField,
  PublishedRecordIdProps,
} from "../../../domain/value-objects";
import { PublishedRecordDTO, PublishedRecordRefDTO } from "./DTOTypes";
import { Mapper } from "../../../../../shared/infra/Mapper";
import { err, ok, Result } from "../../../../../shared/core/Result";
import {
  AnnotationFieldDTO,
  AnnotationFieldMapper,
} from "./AnnotationFieldMapper";

export interface AnnotationTemplateDTO extends PublishedRecordRefDTO {
  id: string;
  curatorId: string;
  name: string;
  description: string;
  createdAt: Date;
  fields: AnnotationTemplateFieldDTO[];
}

export interface AnnotationTemplateFieldDTO {
  fieldId: string;
  required: boolean;
  field: AnnotationFieldDTO; // This would be the AnnotationFieldDTO
}

export class AnnotationTemplateMapper implements Mapper<AnnotationTemplate> {
  public static toDomain(
    raw: AnnotationTemplateDTO
  ): Result<AnnotationTemplate> {
    try {
      // Create value objects
      const curatorIdOrError = CuratorId.create(raw.curatorId);
      const nameOrError = AnnotationTemplateName.create(raw.name);
      const descriptionOrError = AnnotationTemplateDescription.create(
        raw.description
      );

      // Check for errors in value object creation
      if (curatorIdOrError.isErr()) return err(curatorIdOrError.error);
      if (nameOrError.isErr()) return err(nameOrError.error);
      if (descriptionOrError.isErr()) return err(descriptionOrError.error);

      // Create template fields
      const templateFieldsOrError = this.createTemplateFields(raw.fields);
      if (templateFieldsOrError.isErr())
        return err(templateFieldsOrError.error);

      // Create optional published record ID if it exists
      let publishedRecordId: PublishedRecordId | undefined;
      if (raw.publishedRecord) {
        publishedRecordId = PublishedRecordId.create({
          uri: raw.publishedRecord.uri,
          cid: raw.publishedRecord.cid
        });
      }

      // Create the aggregate
      const templateOrError = AnnotationTemplate.create(
        {
          curatorId: curatorIdOrError.value,
          name: nameOrError.value,
          description: descriptionOrError.value,
          annotationTemplateFields: templateFieldsOrError.value,
          createdAt: raw.createdAt,
          publishedRecordId,
        },
        new UniqueEntityID(raw.id)
      );

      if (templateOrError.isErr()) return err(templateOrError.error);

      return ok(templateOrError.value);
    } catch (error) {
      return err(error as Error);
    }
  }

  private static createTemplateFields(
    fieldsDTO: AnnotationTemplateFieldDTO[]
  ): Result<AnnotationTemplateFields> {
    try {
      // This would need to use an AnnotationFieldMapper to convert field DTOs to domain objects
      // For now, we'll assume we have a way to convert them
      const templateFields = fieldsDTO.map((fieldDTO) => {
        // This is a placeholder - in a real implementation, you would use a mapper to convert the field DTO
        const annotationFieldResult = AnnotationFieldMapper.toDomain(
          fieldDTO.field
        );
        if (annotationFieldResult.isErr()) {
          throw new Error(annotationFieldResult.error.message);
        }
        const annotationField = annotationFieldResult.value;

        return AnnotationTemplateField.create({
          annotationField,
          required: fieldDTO.required,
        }).unwrap();
      });

      return AnnotationTemplateFields.create(templateFields);
    } catch (error) {
      return err(error as Error);
    }
  }

  public static toPersistence(template: AnnotationTemplate): {
    template: {
      id: string;
      curatorId: string;
      name: string;
      description: string;
      createdAt: Date;
      publishedRecordId?: string;
    };
    publishedRecord?: PublishedRecordDTO;
    fields: {
      id: string;
      templateId: string;
      fieldId: string;
      required: boolean;
    }[];
  } {
    // Create published record data if it exists
    let publishedRecord: PublishedRecordDTO | undefined;
    let publishedRecordId: string | undefined;
    
    if (template.publishedRecordId) {
      const recordId = new UniqueEntityID().toString();
      publishedRecord = {
        id: recordId,
        uri: template.publishedRecordId.uri,
        cid: template.publishedRecordId.cid,
        recordedAt: new Date()
      };
      publishedRecordId = recordId;
    }

    return {
      template: {
        id: template.id.toString(),
        curatorId: template.curatorId.value,
        name: template.name.value,
        description: template.description.value,
        createdAt: template.createdAt,
        publishedRecordId,
      },
      publishedRecord,
      fields: template.annotationTemplateFields.annotationTemplateFields.map(
        (field) => ({
          id: new UniqueEntityID().toString(), // Generate a new ID for the join table
          templateId: template.id.toString(),
          fieldId: field.annotationField.fieldId.getStringValue(),
          required: field.isRequired(),
        })
      ),
    };
  }
}
