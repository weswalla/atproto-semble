import { UniqueEntityID } from "../../../../../shared/domain/UniqueEntityID";
import { AnnotationField } from "../../../domain/AnnotationField";
import {
  AnnotationFieldName,
  AnnotationFieldDescription,
  CuratorId,
  PublishedRecordId,
} from "../../../domain/value-objects";
import {
  DyadFieldDef,
  TriadFieldDef,
  RatingFieldDef,
  SingleSelectFieldDef,
  MultiSelectFieldDef,
  AnnotationFieldDefinition,
} from "../../../domain/value-objects/AnnotationFieldDefinition";
import { AnnotationType } from "../../../domain/value-objects/AnnotationType";
import { err, Result } from "../../../../../shared/core/Result";

// Database representation of an annotation field
export interface AnnotationFieldDTO {
  id: string;
  curatorId: string;
  name: string;
  description: string;
  definitionType: string;
  definitionData: any; // JSON data for the definition
  createdAt: Date;
  publishedRecordId: string | null;
}

export class AnnotationFieldMapper {
  public static toDomain(dto: AnnotationFieldDTO): Result<AnnotationField> {
    // Create value objects
    const curatorIdOrError = CuratorId.create(dto.curatorId);
    if (curatorIdOrError.isErr()) {
      return err(curatorIdOrError.error);
    }

    const nameOrError = AnnotationFieldName.create(dto.name);
    if (nameOrError.isErr()) {
      return err(nameOrError.error);
    }

    const descriptionOrError = AnnotationFieldDescription.create(
      dto.description
    );
    if (descriptionOrError.isErr()) {
      return err(descriptionOrError.error);
    }

    // Create the appropriate definition based on type
    let definitionOrError: Result<AnnotationFieldDefinition>;

    switch (dto.definitionType) {
      case AnnotationType.DYAD.value:
        definitionOrError = DyadFieldDef.create({
          sideA: dto.definitionData.sideA,
          sideB: dto.definitionData.sideB,
        });
        break;
      case AnnotationType.TRIAD.value:
        definitionOrError = TriadFieldDef.create({
          vertexA: dto.definitionData.vertexA,
          vertexB: dto.definitionData.vertexB,
          vertexC: dto.definitionData.vertexC,
        });
        break;
      case AnnotationType.RATING.value:
        definitionOrError = RatingFieldDef.create();
        break;
      case AnnotationType.SINGLE_SELECT.value:
        definitionOrError = SingleSelectFieldDef.create({
          options: dto.definitionData.options,
        });
        break;
      case AnnotationType.MULTI_SELECT.value:
        definitionOrError = MultiSelectFieldDef.create({
          options: dto.definitionData.options,
        });
        break;
      default:
        return err(
          new Error(`Unknown annotation field type: ${dto.definitionType}`)
        );
    }

    if (definitionOrError.isErr()) {
      return err(definitionOrError.error);
    }

    // Create published record ID if it exists
    let publishedRecordId: PublishedRecordId | undefined;
    if (dto.publishedRecordId) {
      publishedRecordId = PublishedRecordId.create(dto.publishedRecordId);
    }

    // Create the annotation field
    return AnnotationField.create(
      {
        curatorId: curatorIdOrError.value,
        name: nameOrError.value,
        description: descriptionOrError.value,
        definition: definitionOrError.value,
        createdAt: dto.createdAt,
        publishedRecordId,
      },
      new UniqueEntityID(dto.id)
    );
  }

  public static toPersistence(field: AnnotationField): AnnotationFieldDTO {
    const definition = field.definition;
    let definitionType: string;
    let definitionData: any;

    // Extract the appropriate data based on definition type
    if (definition instanceof DyadFieldDef) {
      definitionType = AnnotationType.DYAD.value;
      definitionData = {
        sideA: definition.sideA,
        sideB: definition.sideB,
      };
    } else if (definition instanceof TriadFieldDef) {
      definitionType = AnnotationType.TRIAD.value;
      definitionData = {
        vertexA: definition.vertexA,
        vertexB: definition.vertexB,
        vertexC: definition.vertexC,
      };
    } else if (definition instanceof RatingFieldDef) {
      definitionType = AnnotationType.RATING.value;
      definitionData = {
        numberOfStars: definition.numberOfStars,
      };
    } else if (definition instanceof SingleSelectFieldDef) {
      definitionType = AnnotationType.SINGLE_SELECT.value;
      definitionData = {
        options: definition.options,
      };
    } else if (definition instanceof MultiSelectFieldDef) {
      definitionType = AnnotationType.MULTI_SELECT.value;
      definitionData = {
        options: definition.options,
      };
    } else {
      throw new Error("Unknown annotation field definition type");
    }

    return {
      id: field.fieldId.getStringValue(),
      curatorId: field.curatorId.value,
      name: field.name.value,
      description: field.description.value,
      definitionType,
      definitionData,
      createdAt: field.createdAt,
      publishedRecordId: field.publishedRecordId?.getValue() || null,
    };
  }
}
