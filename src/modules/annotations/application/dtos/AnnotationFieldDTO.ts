// Placeholder for AnnotationField Data Transfer Object

export interface AnnotationFieldInputDTO {
  name: string
  description: string
  definition: any // Structure matches FieldDefinition types, plain JS object
}

export interface AnnotationFieldOutputDTO {
  id: string // TID as string
  name: string
  description: string
  definition: any // Structure matches FieldDefinition types
  createdAt: string // ISO Date string
}
