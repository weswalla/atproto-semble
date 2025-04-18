import { TemplateField } from '../value-objects/TemplateField'
import { TID } from '../../../atproto/domain/value-objects/TID'

// Properties required to construct an AnnotationTemplate
export interface AnnotationTemplateProps {
  id: TID
  name: string
  description: string
  annotationFields: TemplateField[]
  createdAt: Date
}

// Properties required to create a new AnnotationTemplate
export type AnnotationTemplateCreateProps = Omit<
  AnnotationTemplateProps,
  'id' | 'createdAt'
> & {
  id?: TID // Allow providing an ID optionally
}

// Placeholder for AnnotationTemplate Aggregate Root
export class AnnotationTemplate {
  readonly id: TID
  readonly name: string
  readonly description: string
  readonly annotationFields: TemplateField[]
  readonly createdAt: Date

  private constructor(props: AnnotationTemplateProps) {
    this.id = props.id
    this.name = props.name
    this.description = props.description
    this.annotationFields = props.annotationFields
    this.createdAt = props.createdAt

    // TODO: Add more validation logic here if needed
  }

  public static create(props: AnnotationTemplateCreateProps): AnnotationTemplate {
    const id = props.id ?? TID.create()
    const createdAt = new Date()

    // TODO: Add validation
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('AnnotationTemplate name cannot be empty.')
    }
    if (!props.annotationFields || props.annotationFields.length === 0) {
      throw new Error('AnnotationTemplate must include at least one field.')
    }
    // Add more validation as needed (e.g., description length)

    const constructorProps: AnnotationTemplateProps = {
      ...props,
      id,
      createdAt,
    }

    return new AnnotationTemplate(constructorProps)
  }

  // Method to add a field (example of behavior)
  public addField(field: TemplateField): void {
    // TODO: Add logic to prevent duplicates, etc.
    this.annotationFields.push(field)
  }

  // Method to remove a field
  public removeField(fieldRefUri: string): void {
    // TODO: Implement removal logic
    const index = this.annotationFields.findIndex(
      (f) => f.fieldRef.uri === fieldRefUri,
    )
    if (index > -1) {
      this.annotationFields.splice(index, 1)
    }
  }
}
