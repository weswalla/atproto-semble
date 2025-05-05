import { $Typed } from "@atproto/api";
import { Annotation } from "src/modules/annotations/domain/aggregates/Annotation";
import {
  Record,
  DyadValue,
  TriadValue,
  RatingValue,
  SingleSelectValue,
  MultiSelectValue,
} from "./lexicon/types/app/annos/annotation";
import { StrongRef } from "../domain";
import {
  DyadValue as DyadValueObject,
  TriadValue as TriadValueObject,
  RatingValue as RatingValueObject,
  SingleSelectValue as SingleSelectValueObject,
  MultiSelectValue as MultiSelectValueObject,
} from "src/modules/annotations/domain/value-objects/AnnotationValue";

type AnnotationRecordDTO = Record;

export class AnnotationMapper {
  static toCreateRecordDTO(annotation: Annotation): AnnotationRecordDTO {
    // Create the base record
    const record: AnnotationRecordDTO = {
      $type: "app.annos.annotation",
      url: annotation.url.value,
      field: this.createFieldRef(annotation),
      value: this.mapAnnotationValue(annotation.value),
      createdAt:
        annotation.createdAt?.toISOString() || new Date().toISOString(),
    };

    // Add optional properties
    if (annotation.note) {
      record.note = annotation.note.getValue();
    }

    if (
      annotation.annotationTemplateIds &&
      annotation.annotationTemplateIds.length > 0
    ) {
      record.fromTemplates = annotation.annotationTemplateIds.map(
        (templateId) => {
          // This assumes the template is published and has a StrongRef
          const templateRef = new StrongRef({
            uri: templateId.getStringValue(),
            cid: "", // This would need to be populated from the actual template reference
          });

          return {
            uri: templateRef.getValue().uri,
            cid: templateRef.getValue().cid,
          };
        }
      );
    }

    // Add additional identifiers if any
    // This would be implemented if the domain model supports additional identifiers

    return record;
  }

  private static createFieldRef(annotation: Annotation): {
    uri: string;
    cid: string;
  } {
    if (!annotation.annotationFieldId) {
      throw new Error("Annotation must have a field ID");
    }

    // This assumes the field is published and has a StrongRef
    // In a real implementation, you might need to look up the field's published record
    const fieldRef = new StrongRef({
      uri: annotation.annotationFieldId.getStringValue(),
      cid: "", // This would need to be populated from the actual field reference
    });

    return {
      uri: fieldRef.getValue().uri,
      cid: fieldRef.getValue().cid,
    };
  }

  private static mapAnnotationValue(
    value: any
  ): $Typed<
    DyadValue | TriadValue | RatingValue | SingleSelectValue | MultiSelectValue
  > {
    if (value instanceof DyadValueObject) {
      return {
        $type: "app.annos.annotation#dyadValue",
        value: value.value,
      };
    } else if (value instanceof TriadValueObject) {
      const triadValue = value.props;
      return {
        $type: "app.annos.annotation#triadValue",
        vertexA: triadValue.vertexA,
        vertexB: triadValue.vertexB,
        vertexC: triadValue.vertexC,
      };
    } else if (value instanceof RatingValueObject) {
      return {
        $type: "app.annos.annotation#ratingValue",
        rating: value.rating,
      };
    } else if (value instanceof SingleSelectValueObject) {
      return {
        $type: "app.annos.annotation#singleSelectValue",
        option: value.option,
      };
    } else if (value instanceof MultiSelectValueObject) {
      return {
        $type: "app.annos.annotation#multiSelectValue",
        options: value.options,
      };
    } else {
      throw new Error(`Unsupported annotation value type: ${typeof value}`);
    }
  }
}
