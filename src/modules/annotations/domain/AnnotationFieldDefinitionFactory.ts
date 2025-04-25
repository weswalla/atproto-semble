import { Result } from "src/shared/core/Result";
import { AnnotationType } from "./value-objects/AnnotationType";
import {
  AnnotationFieldDefinition,
  AnnotationFieldDefProps,
  DyadFieldDef,
  IDyadFieldDefProps,
  ISelectFieldDefProps,
  ITriadFieldDefProps,
  MultiSelectFieldDef,
  SingleSelectFieldDef,
  TriadFieldDef,
} from "./value-objects";

interface CreateAnnotationFieldDefProps {
  type: AnnotationType;
  fieldDefProps: AnnotationFieldDefProps;
}

export class AnnotationFieldDefinitionFactory {
  static create(
    props: CreateAnnotationFieldDefProps
  ): Result<AnnotationFieldDefinition> {
    switch (props.type.value) {
      case AnnotationType.DYAD.value:
        return DyadFieldDef.create(props.fieldDefProps as IDyadFieldDefProps);
      case AnnotationType.TRIAD.value:
        return TriadFieldDef.create(props.fieldDefProps as ITriadFieldDefProps);
      case AnnotationType.SINGLE_SELECT.value:
        return SingleSelectFieldDef.create(
          props.fieldDefProps as ISelectFieldDefProps
        );
      case AnnotationType.MULTI_SELECT.value:
        return MultiSelectFieldDef.create(
          props.fieldDefProps as ISelectFieldDefProps
        );
      default:
        return fail("Invalid annotation field type.");
    }
  }
}
