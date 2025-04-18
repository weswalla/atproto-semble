import { AnnotationField } from '../../../../src/annotations/domain/aggregates/AnnotationField'
import { IAnnotationFieldRepository } from '../../../../src/annotations/application/repositories/IAnnotationFieldRepository'
import { TID } from '../../../../src/atproto/domain/value-objects/TID'

export class InMemoryAnnotationFieldRepository
  implements IAnnotationFieldRepository
{
  private fields: Map<string, AnnotationField> = new Map()
  // We need a way to look up by URI as well for findByUri
  private uriToIdMap: Map<string, string> = new Map()

  async findById(id: TID): Promise<AnnotationField | null> {
    const field = this.fields.get(id.toString())
    // Return a clone to prevent mutation of the stored object
    return field ? this.clone(field) : null
  }

  async findByUri(uri: string): Promise<AnnotationField | null> {
    const id = this.uriToIdMap.get(uri)
    if (!id) return null
    const field = this.fields.get(id)
    return field ? this.clone(field) : null
  }

  async findByName(name: string): Promise<AnnotationField | null> {
    for (const field of this.fields.values()) {
      if (field.name === name) {
        return this.clone(field)
      }
    }
    return null
  }

  async save(field: AnnotationField): Promise<void> {
    // Store a clone to prevent external mutations affecting the stored object
    const fieldToStore = this.clone(field)
    this.fields.set(fieldToStore.id.toString(), fieldToStore)

    // Assume URI is derived from ID for simplicity in this mock,
    // or requires a specific format. Adjust if URI is independent.
    // Example: Construct a plausible AT URI (replace with actual logic if needed)
    const uri = `at://did:plc:fake/${fieldToStore.id.toString()}/app.annos.annotationField`
    this.uriToIdMap.set(uri, fieldToStore.id.toString())
  }

  async delete(id: TID): Promise<void> {
    const field = this.fields.get(id.toString())
    if (field) {
      // Find and remove from uriToIdMap as well
      let uriToRemove: string | null = null
      for (const [uri, storedId] of this.uriToIdMap.entries()) {
        if (storedId === id.toString()) {
          uriToRemove = uri
          break
        }
      }
      if (uriToRemove) {
        this.uriToIdMap.delete(uriToRemove)
      }
      this.fields.delete(id.toString())
    }
  }

  // Helper to clear the store between tests
  public clear(): void {
    this.fields.clear()
    this.uriToIdMap.clear()
  }

  // Helper to get the raw stored field for assertions (use carefully)
  public getStoredField(id: TID): AnnotationField | undefined {
    return this.fields.get(id.toString())
  }

  // Simple cloning function (adjust if deep cloning is needed for complex objects)
  private clone(field: AnnotationField): AnnotationField {
    // Re-create the object using its factory to ensure immutability and validation
    // This assumes the aggregate's create method can handle existing IDs/timestamps
    // or that we have access to the constructor/props.
    // Using Object.assign for simplicity here, but might not be robust enough
    // if value objects have methods or complex internal state.
    // A better approach might be a dedicated `clone` method on the aggregate
    // or using the constructor props if accessible.
    const props = {
      id: field.id,
      name: field.name,
      description: field.description,
      definition: field.definition, // Assuming definition is immutable or cloneable
      createdAt: field.createdAt,
    }
    // We need access to the constructor or a hydrate method.
    // Let's assume a static hydrate method exists for this example:
    // return AnnotationField.hydrate(props);

    // Fallback: simple spread (less safe for complex objects/methods)
    // return { ...field }; // This doesn't return an instance of AnnotationField

    // Simplest approach for testing: return the original object if mutation isn't a concern
    // return field;

    // Let's stick to returning a plain object copy for now, acknowledging limitations
    // This won't be an instance of AnnotationField, which might break some tests.
    // The BEST way is a proper hydrate/clone on the Aggregate.
    const clonedProps = JSON.parse(JSON.stringify(props)) // Basic deep clone
    // Reconstruct value objects if necessary (TID, FieldDefinition)
    return AnnotationField.create({
      id: TID.fromString(clonedProps.id.tid), // Assuming TID has fromString/tid property
      name: clonedProps.name,
      description: clonedProps.description,
      definition: clonedProps.definition, // Assuming definition is plain data
      createdAt: new Date(clonedProps.createdAt),
    })
  }
}
