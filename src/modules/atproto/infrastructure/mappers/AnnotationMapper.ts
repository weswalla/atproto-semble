import { $Typed } from "@atproto/api";
import { Annotation } from "src/modules/annotations/domain/aggregates/Annotation";
import {
  Record,
  DyadValue,
  TriadValue,
  RatingValue,
  SingleSelectValue,
  MultiSelectValue,
} from "../lexicon/types/network/cosmik/annotation";
import {
  DyadValue as DyadValueObject,
  TriadValue as TriadValueObject,
  RatingValue as RatingValueObject,
  SingleSelectValue as SingleSelectValueObject,
  MultiSelectValue as MultiSelectValueObject,
} from "src/modules/annotations/domain/value-objects/AnnotationValue";
import { AnnotationTemplate } from "src/modules/annotations/domain/aggregates";

type AnnotationRecordDTO = Record;

export class AnnotationMapper {
  static toCreateRecordDTO(annotation: Annotation): AnnotationRecordDTO {
    // Create the base record
    const fieldStrongRef = this.createFieldRef(annotation);
    const record: AnnotationRecordDTO = {
      $type: "network.cosmik.annotation",
      url: annotation.url.value,
      field: fieldStrongRef,
      value: this.mapAnnotationValue(annotation.value),
      createdAt:
        annotation.createdAt?.toISOString() || new Date().toISOString(),
    };

    // Add optional properties
    if (annotation.note) {
      record.note = annotation.note.getValue();
    }

    // Add additional identifiers if any
    // This would be implemented if the domain model supports additional identifiers
    return record;
  }

  static toCreateRecordDTOFromTemplate(
    annotation: Annotation,
    template: AnnotationTemplate
  ): AnnotationRecordDTO {
    if (!template.publishedRecordId) {
      throw new Error("Template must have a published record ID");
    }
    const recordWithoutTemplate = this.toCreateRecordDTO(annotation);

    const templateStrongRef = {
      uri: template.publishedRecordId.getValue().uri,
      cid: template.publishedRecordId.getValue().cid,
    };
    const record: AnnotationRecordDTO = {
      ...recordWithoutTemplate,
      fromTemplates: [templateStrongRef],
    };
    return record;
  }

  private static createFieldRef(annotation: Annotation): {
    uri: string;
    cid: string;
  } {
    const field = annotation.annotationField;
    if (!field) {
      throw new Error("Annotation must have a field");
    }

    // Check if the field has a published record ID
    if (!field.publishedRecordId) {
      throw new Error(
        `Field ${field.fieldId.getStringValue()} is not published`
      );
    }

    // Get the published record ID from the field
    const publishedRecordId = field.publishedRecordId.getValue();

    return {
      uri: publishedRecordId.uri,
      cid: publishedRecordId.cid,
    };
  }

  private static mapAnnotationValue(
    value: any
  ): $Typed<
    DyadValue | TriadValue | RatingValue | SingleSelectValue | MultiSelectValue
  > {
    if (value instanceof DyadValueObject) {
      return {
        $type: "network.cosmik.annotation#dyadValue",
        value: value.value,
      };
    } else if (value instanceof TriadValueObject) {
      const triadValue = value.props;
      return {
        $type: "network.cosmik.annotation#triadValue",
        vertexA: triadValue.vertexA,
        vertexB: triadValue.vertexB,
        vertexC: triadValue.vertexC,
      };
    } else if (value instanceof RatingValueObject) {
      return {
        $type: "network.cosmik.annotation#ratingValue",
        rating: value.rating,
      };
    } else if (value instanceof SingleSelectValueObject) {
      return {
        $type: "network.cosmik.annotation#singleSelectValue",
        option: value.option,
      };
    } else if (value instanceof MultiSelectValueObject) {
      return {
        $type: "network.cosmik.annotation#multiSelectValue",
        options: value.options,
      };
    } else {
      throw new Error(`Unsupported annotation value type: ${typeof value}`);
    }
  }
}
