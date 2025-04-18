import { AnnotationOutputDTO } from './AnnotationDTO'

/**
 * Input for filling an annotation template for a specific resource.
 */
export interface FillAnnotationTemplateInputDTO {
  /** The AT URI of the AnnotationTemplate to use. */
  templateRefUri: string
  /** The URL of the resource being annotated. */
  url: string
  /**
   * A map where keys are the AT URIs of the AnnotationFields defined in the template,
   * and values are the plain JS objects representing the AnnotationValue for each field.
   * The structure of the value object must match the expected AnnotationValue type
   * (e.g., { $type: 'app.annos.annotation#ratingValue', rating: 5 }).
   */
  values: Record<string, any> // Key: AnnotationField AT URI, Value: Plain JS AnnotationValue
  /** Optional additional identifiers to apply to *each* created annotation. */
  additionalIdentifiers?: { type: string; value: string }[]
  /** Optional note to apply to *each* created annotation. */
  note?: string
}

/**
 * Output after successfully filling an annotation template.
 */
export interface FillAnnotationTemplateOutputDTO {
  /** An array containing the DTOs of all annotations created. */
  annotations: AnnotationOutputDTO[]
}
