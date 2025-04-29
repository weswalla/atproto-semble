import { UniqueEntityID } from "../../../../../shared/domain/UniqueEntityID";
import { AnnotationTemplate } from "../../../domain/aggregates/AnnotationTemplate";
import { AnnotationField } from "../../../domain/aggregates/AnnotationField";
import {
  AnnotationTemplateName,
  AnnotationTemplateDescription,
  CuratorId,
  PublishedRecordId,
  AnnotationTemplateFields,
  AnnotationTemplateField,
} from "../../../domain/value-objects";
import { Mapper } from "../../../../../shared/infra/Mapper";
import { Result } from "../../../../../shared/core/Result";

export interface AnnotationTemplateDTO {
  id: string;
  curatorId: string;
  name: string;
  description: string;
  createdAt: Date;
  publishedRecordId?: string;
  fields: AnnotationTemplateFieldDTO[];
}

export interface AnnotationTemplateFieldDTO {
  fieldId: string;
  required: boolean;
  field: any; // This would be the AnnotationFieldDTO
}

export class AnnotationTemplateMapper implements Mapper<AnnotationTemplate> {
  public static toDomain(raw: AnnotationTemplateDTO): Result<AnnotationTemplate> {
    try {
      // Create value objects
      const curatorIdOrError = CuratorId.create(raw.curatorId);
      const nameOrError = AnnotationTemplateName.create(raw.name);
      const descriptionOrError = AnnotationTemplateDescription.create(raw.description);
      
      // Check for errors in value object creation
      if (curatorIdOrError.isErr()) return Result.err(curatorIdOrError.error);
      if (nameOrError.isErr()) return Result.err(nameOrError.error);
      if (descriptionOrError.isErr()) return Result.err(descriptionOrError.error);
      
      // Create template fields
      const templateFieldsOrError = this.createTemplateFields(raw.fields);
      if (templateFieldsOrError.isErr()) return Result.err(templateFieldsOrError.error);
      
      // Create optional published record ID if it exists
      let publishedRecordId: PublishedRecordId | undefined;
      if (raw.publishedRecordId) {
        publishedRecordId = PublishedRecordId.create(raw.publishedRecordId);
      }
      
      // Create the aggregate
      const templateOrError = AnnotationTemplate.create({
        curatorId: curatorIdOrError.value,
        name: nameOrError.value,
        description: descriptionOrError.value,
        annotationTemplateFields: templateFieldsOrError.value,
        createdAt: raw.createdAt,
        publishedRecordId,
      }, new UniqueEntityID(raw.id));
      
      if (templateOrError.isErr()) return Result.err(templateOrError.error);
      
      return Result.ok(templateOrError.value);
    } catch (error) {
      return Result.err(error);
    }
  }
  
  private static createTemplateFields(fieldsDTO: AnnotationTemplateFieldDTO[]): Result<AnnotationTemplateFields> {
    try {
      // This would need to use an AnnotationFieldMapper to convert field DTOs to domain objects
      // For now, we'll assume we have a way to convert them
      const templateFields = fieldsDTO.map(fieldDTO => {
        // This is a placeholder - in a real implementation, you would use a mapper to convert the field DTO
        const annotationField = /* AnnotationFieldMapper.toDomain(fieldDTO.field).value */;
        
        return AnnotationTemplateField.create({
          annotationField,
          required: fieldDTO.required
        }).value;
      });
      
      return AnnotationTemplateFields.create(templateFields);
    } catch (error) {
      return Result.err(error);
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
    },
    fields: {
      id: string;
      templateId: string;
      fieldId: string;
      required: boolean;
    }[]
  } {
    return {
      template: {
        id: template.id.toString(),
        curatorId: template.curatorId.value,
        name: template.name.value,
        description: template.description.value,
        createdAt: template.createdAt,
        publishedRecordId: template.publishedRecordId?.getValue(),
      },
      fields: template.annotationTemplateFields.annotationTemplateFields.map(field => ({
        id: new UniqueEntityID().toString(), // Generate a new ID for the join table
        templateId: template.id.toString(),
        fieldId: field.annotationField.fieldId.getStringValue(),
        required: field.isRequired(),
      }))
    };
  }
}
