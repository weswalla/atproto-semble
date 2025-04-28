import { err, ok, Result } from "../../../shared/core/Result";
import { AnnotationType } from "./value-objects/AnnotationType";
import {
  AnnotationValue,
  DyadValue,
  MultiSelectValue,
  RatingValue,
  SingleSelectValue,
  TriadValue,
} from "./value-objects/AnnotationValue";

// Define interfaces for the different value types
interface IDyadValueInput {
  value: number;
}

interface ITriadValueInput {
  vertexA: number;
  vertexB: number;
  vertexC: number;
}

interface IRatingValueInput {
  rating: number;
}

interface ISingleSelectValueInput {
  option: string;
}

interface IMultiSelectValueInput {
  options: string[];
}

// Union type for all possible value inputs
export type AnnotationValueInput =
  | IDyadValueInput
  | ITriadValueInput
  | IRatingValueInput
  | ISingleSelectValueInput
  | IMultiSelectValueInput;

interface CreateAnnotationValueProps {
  type: AnnotationType;
  valueInput: AnnotationValueInput;
}

export class AnnotationValueFactory {
  static create(
    props: CreateAnnotationValueProps
  ): Result<AnnotationValue> {
    try {
      switch (props.type.value) {
        case AnnotationType.DYAD.value:
          if (!this.isDyadValueInput(props.valueInput)) {
            return err(new Error("Invalid dyad value input"));
          }
          return ok(DyadValue.create(props.valueInput));

        case AnnotationType.TRIAD.value:
          if (!this.isTriadValueInput(props.valueInput)) {
            return err(new Error("Invalid triad value input"));
          }
          return ok(TriadValue.create(props.valueInput));

        case AnnotationType.RATING.value:
          if (!this.isRatingValueInput(props.valueInput)) {
            return err(new Error("Invalid rating value input"));
          }
          return ok(RatingValue.create(props.valueInput));

        case AnnotationType.SINGLE_SELECT.value:
          if (!this.isSingleSelectValueInput(props.valueInput)) {
            return err(new Error("Invalid single select value input"));
          }
          return ok(SingleSelectValue.create(props.valueInput.option));

        case AnnotationType.MULTI_SELECT.value:
          if (!this.isMultiSelectValueInput(props.valueInput)) {
            return err(new Error("Invalid multi select value input"));
          }
          return ok(MultiSelectValue.create(props.valueInput.options));

        default:
          return err(new Error("Invalid annotation value type"));
      }
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Type guards for each value input type
  private static isDyadValueInput(input: any): input is IDyadValueInput {
    return typeof input === "object" && typeof input.value === "number";
  }

  private static isTriadValueInput(input: any): input is ITriadValueInput {
    return (
      typeof input === "object" &&
      typeof input.vertexA === "number" &&
      typeof input.vertexB === "number" &&
      typeof input.vertexC === "number"
    );
  }

  private static isRatingValueInput(input: any): input is IRatingValueInput {
    return typeof input === "object" && typeof input.rating === "number";
  }

  private static isSingleSelectValueInput(
    input: any
  ): input is ISingleSelectValueInput {
    return typeof input === "object" && typeof input.option === "string";
  }

  private static isMultiSelectValueInput(
    input: any
  ): input is IMultiSelectValueInput {
    return (
      typeof input === "object" &&
      Array.isArray(input.options) &&
      input.options.every((opt: any) => typeof opt === "string")
    );
  }
}
