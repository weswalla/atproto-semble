import { $Typed, ComAtprotoRepoCreateRecord } from "@atproto/api";
import { AnnotationField } from "src/modules/annotations/domain/aggregates";
import {
  DyadFieldDef as DyadFieldDefValueObject,
  TriadFieldDef as TriadFieldDefValueObject,
  MultiSelectFieldDef as MultiSelectFieldDefValueObject,
  SingleSelectFieldDef as SingleSelectFieldDefValueObject,
  RatingFieldDef as RatingFieldDefValueObject,
} from "src/modules/annotations/domain/value-objects/AnnotationFieldDefinition";
import {
  DyadFieldDef,
  MultiSelectFieldDef,
  RatingFieldDef,
  Record,
  SingleSelectFieldDef,
  TriadFieldDef,
} from "../lexicon/types/network/cosmik/annotationField";
import { AnnotationType } from "src/modules/annotations/domain/value-objects/AnnotationType";

ComAtprotoRepoCreateRecord;

type AnnotationFieldRecordDTO = Record;

type AnnotationFieldDefDTO =
  | $Typed<DyadFieldDef>
  | $Typed<TriadFieldDef>
  | $Typed<RatingFieldDef>
  | $Typed<SingleSelectFieldDef>
  | $Typed<MultiSelectFieldDef>;

export class AnnotationFieldMapper {
  static toCreateRecordDTO(
    annotationField: AnnotationField
  ): AnnotationFieldRecordDTO {
    AnnotationFieldMapper.toFieldDefinitionDTO(annotationField);
    return {
      $type: "network.cosmik.annotationField",
      name: annotationField.name.value,
      description: annotationField.description.value,
      createdAt: annotationField.createdAt.toISOString(),
      definition: AnnotationFieldMapper.toFieldDefinitionDTO(annotationField),
    };
  }

  static toFieldDefinitionDTO(
    annotationField: AnnotationField
  ): AnnotationFieldDefDTO {
    const def = annotationField.definition;
    const defType = def.type.value;
    switch (defType) {
      case AnnotationType.DYAD.value:
        const dyadDef = def as DyadFieldDefValueObject;
        return {
          $type: "network.cosmik.annotationField#dyadFieldDef",
          sideA: dyadDef.props.sideA,
          sideB: dyadDef.props.sideB,
        };
      case AnnotationType.TRIAD.value:
        const triadDef = def as TriadFieldDefValueObject;
        return {
          $type: "network.cosmik.annotationField#triadFieldDef",
          vertexA: triadDef.props.vertexA,
          vertexB: triadDef.props.vertexB,
          vertexC: triadDef.props.vertexC,
        };
      case AnnotationType.RATING.value:
        const ratingDef = def as RatingFieldDefValueObject;
        return {
          $type: "network.cosmik.annotationField#ratingFieldDef",
          numberOfStars: ratingDef.props.numberOfStars,
        };
      case AnnotationType.SINGLE_SELECT.value:
        const singleSelectDef = def as SingleSelectFieldDefValueObject;
        return {
          $type: "network.cosmik.annotationField#singleSelectFieldDef",
          options: singleSelectDef.props.options,
        };
      case AnnotationType.MULTI_SELECT.value:
        const multiSelectDef = def as MultiSelectFieldDefValueObject;
        return {
          $type: "network.cosmik.annotationField#multiSelectFieldDef",
          options: multiSelectDef.props.options,
        };
      default:
        throw new Error(`Unsupported field definition type: ${defType}`);
    }
  }
}
