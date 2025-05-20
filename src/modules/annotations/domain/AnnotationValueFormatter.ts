import { AnnotationType } from "./value-objects/AnnotationType";
import {
  AnnotationValue,
  DyadValue,
  MultiSelectValue,
  RatingValue,
  SingleSelectValue,
  TriadValue,
} from "./value-objects/AnnotationValue";

export class AnnotationValueFormatter {
  /**
   * Creates a human-readable preview of an annotation value
   * @param value The annotation value to format
   * @returns A string representation of the value
   */
  static createPreview(value: AnnotationValue): string {
    try {
      switch (value.type.value) {
        case AnnotationType.DYAD.value:
          return this.formatDyadValue(value as DyadValue);
        
        case AnnotationType.TRIAD.value:
          return this.formatTriadValue(value as TriadValue);
        
        case AnnotationType.RATING.value:
          return this.formatRatingValue(value as RatingValue);
        
        case AnnotationType.SINGLE_SELECT.value:
          return this.formatSingleSelectValue(value as SingleSelectValue);
        
        case AnnotationType.MULTI_SELECT.value:
          return this.formatMultiSelectValue(value as MultiSelectValue);
        
        default:
          return "Custom value";
      }
    } catch (error) {
      console.error("Error formatting annotation value:", error);
      return "Value preview unavailable";
    }
  }

  private static formatDyadValue(value: DyadValue): string {
    return `Value: ${value.value}`;
  }

  private static formatTriadValue(value: TriadValue): string {
    return `Values: ${value.vertexA}, ${value.vertexB}, ${value.vertexC}`;
  }

  private static formatRatingValue(value: RatingValue): string {
    return `Rating: ${value.rating}`;
  }

  private static formatSingleSelectValue(value: SingleSelectValue): string {
    return `Selected: ${value.option}`;
  }

  private static formatMultiSelectValue(value: MultiSelectValue): string {
    return `Selected: ${value.options.join(", ")}`;
  }
}
