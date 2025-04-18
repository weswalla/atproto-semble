// Placeholder for Annotation Data Transfer Object
// Used for API input/output to decouple from the domain model

export interface AnnotationInputDTO {
  url: string;
  fieldRefUri: string; // URI of the AnnotationField
  value: any; // Structure matches AnnotationValue types, but plain JS object
  additionalIdentifiers?: { type: string; value: string }[];
  templateRefUris?: string[]; // URIs of AnnotationTemplate(s)
  note?: string;
}

export interface AnnotationOutputDTO {
  id: string; // TID as string
  url: string;
  value: any; // Structure matches AnnotationValue types
  additionalIdentifiers?: { type: string; value: string }[];
  templateRefs?: { cid: string; uri: string }[]; // StrongRef structure
  note?: string;
  createdAt?: string; // ISO Date string
}
