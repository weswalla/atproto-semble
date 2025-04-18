// Placeholder for AnnotationTemplate Data Transfer Object

export interface AnnotationTemplateInputDTO {
  name: string
  description: string
  annotationFields: {
    ref: { uri: string; cid: string } // StrongRef structure (or just URI on input?)
    required?: boolean
  }[]
}

export interface AnnotationTemplateOutputDTO {
  id: string // TID as string
  name: string
  description: string
  annotationFields: {
    ref: { uri: string; cid: string } // StrongRef structure
    required: boolean
  }[]
  createdAt: string // ISO Date string
}
