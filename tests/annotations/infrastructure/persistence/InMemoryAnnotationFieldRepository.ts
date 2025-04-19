import { AnnotationField } from "../../../../src/modules/annotations/domain/aggregates/AnnotationField";
import { IAnnotationFieldRepository } from "../../../../src/modules/annotations/application/repositories/IAnnotationFieldRepository";
import { AnnotationFieldId } from "../../../../src/modules/annotations/domain/value-objects/AnnotationFieldId";
import { PublishedRecordId } from "../../../../src/modules/annotations/domain/value-objects"; // Added for findByPublishedRecordId

export class InMemoryAnnotationFieldRepository
  implements IAnnotationFieldRepository
{
  // Store fields using the string representation of AnnotationFieldId
  private fields: Map<string, AnnotationField> = new Map();
  // Map PublishedRecordId (AT URI string) to AnnotationFieldId string
  private publishedRecordIdToIdMap: Map<string, string> = new Map();

  async findById(id: AnnotationFieldId): Promise<AnnotationField | null> {
    const field = this.fields.get(id.getStringValue());
    // Return a clone to prevent mutation of the stored object
    return field ? this.clone(field) : null;
  }

  // Renamed findByUri to findByPublishedRecordId for clarity
  async findByPublishedRecordId(recordId: PublishedRecordId): Promise<AnnotationField | null> {
    const fieldIdString = this.publishedRecordIdToIdMap.get(recordId.getValue());
    if (!fieldIdString) return null;
    const field = this.fields.get(fieldIdString);
    return field ? this.clone(field) : null;
  }

  async findByName(name: string): Promise<AnnotationField | null> {
    for (const field of this.fields.values()) {
      // Access the value of the AnnotationFieldName value object
      if (field.name.value === name) {
        return this.clone(field);
      }
    }
    return null;
  }

  async save(field: AnnotationField): Promise<void> {
    // Store a clone to prevent external mutations affecting the stored object
    const fieldToStore = this.clone(field);
    const fieldIdString = fieldToStore.fieldId.getStringValue();
    this.fields.set(fieldIdString, fieldToStore);

    // If the field has a publishedRecordId, update the mapping
    if (fieldToStore.props.publishedRecordId) {
        const recordIdString = fieldToStore.props.publishedRecordId.getValue();
        // Clean up any old mapping for this field ID first
        for (const [key, value] of this.publishedRecordIdToIdMap.entries()) {
            if (value === fieldIdString && key !== recordIdString) {
                this.publishedRecordIdToIdMap.delete(key);
            }
        }
        this.publishedRecordIdToIdMap.set(recordIdString, fieldIdString);
    }
  }

  async delete(id: AnnotationFieldId): Promise<void> {
    const fieldIdString = id.getStringValue();
    const field = this.fields.get(fieldIdString);
    if (field) {
      // Find and remove from publishedRecordIdToIdMap as well
      let recordIdToRemove: string | null = null;
      for (const [recordId, storedId] of this.publishedRecordIdToIdMap.entries()) {
        if (storedId === fieldIdString) {
          recordIdToRemove = recordId;
          break;
        }
      }
      if (recordIdToRemove) {
        this.publishedRecordIdToIdMap.delete(recordIdToRemove);
      }
      this.fields.delete(fieldIdString);
    }
  }

  // Helper to clear the store between tests
  public clear(): void {
    this.fields.clear();
    this.publishedRecordIdToIdMap.clear();
  }

  // Helper to get the raw stored field for assertions (use carefully)
  public getStoredField(id: AnnotationFieldId): AnnotationField | undefined {
    return this.fields.get(id.getStringValue());
  }

  // Clone using the aggregate's static create method to ensure consistency
  private clone(field: AnnotationField): AnnotationField {
    // Use the existing properties and ID to recreate the aggregate instance
    const createResult = AnnotationField.create(
      {
        curatorId: field.curatorId, // Pass the value object instance
        name: field.name, // Pass the value object instance
        description: field.description, // Pass the value object instance
        definition: field.definition, // Pass the value object instance (assuming immutable or cloneable)
        createdAt: field.createdAt, // Pass the Date instance
        publishedRecordId: field.props.publishedRecordId, // Pass the value object instance or undefined
      },
      field.id // Pass the original UniqueEntityID
    );

    // In a real scenario, handle the Result failure case appropriately.
    // For this in-memory repo, we assume cloning a valid object results in a valid object.
    if (createResult.isFailure) {
      // This shouldn't happen if the original field was valid
      console.error("Failed to clone AnnotationField:", createResult.getErrorValue());
      throw new Error("Cloning failed");
    }

    return createResult.getValue();
  }
}
