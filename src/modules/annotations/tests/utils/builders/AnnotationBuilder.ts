import { UniqueEntityID } from "../../../../../shared/domain/UniqueEntityID";
import { Result, ok, err } from "../../../../../shared/core/Result";
import {
  Annotation,
  AnnotationProps,
} from "../../../domain/aggregates/Annotation";
import {
  AnnotationFieldId,
  AnnotationNote,
  AnnotationTemplateId,
  AnnotationValue,
  CuratorId,
  PublishedRecordId,
  PublishedRecordIdProps,
  URI,
} from "../../../domain/value-objects";
import {
  DyadValue,
  TriadValue,
  RatingValue,
  SingleSelectValue,
  MultiSelectValue,
} from "../../../domain/value-objects/AnnotationValue";
import { AnnotationField } from "../../../domain/aggregates";
import { AnnotationType } from "../../../domain/value-objects/AnnotationType";
import { AnnotationValueFactory } from "../../../domain/AnnotationValueFactory";

export class AnnotationBuilder {
  private _id?: UniqueEntityID;
  private _curatorId: string = "did:plc:defaultCurator";
  private _url: string = "https://example.com/resource";
  private _annotationFieldId: string = "default-field-id";
  private _annotationField?: AnnotationField;
  private _value?: AnnotationValue; // Will be set based on type
  private _valueProps: any = {}; // For storing value props before creating value
  private _valueType: string = "dyad"; // Default value type
  private _annotationTemplateIds: string[] = [];
  private _note?: string;
  private _createdAt?: Date;
  private _publishedRecordId?: PublishedRecordIdProps;

  withId(id: UniqueEntityID): this {
    this._id = id;
    return this;
  }

  withCuratorId(curatorId: string): this {
    this._curatorId = curatorId;
    return this;
  }

  withUrl(url: string): this {
    this._url = url;
    return this;
  }

  // Deprecated - use withAnnotationField instead
  withAnnotationFieldId(fieldId: string): this {
    console.warn("withAnnotationFieldId is deprecated. Use withAnnotationField instead.");
    this._annotationFieldId = fieldId;
    this._annotationField = undefined; // Clear field if ID is set directly
    return this;
  }

  withAnnotationField(field: AnnotationField): this {
    this._annotationField = field;
    this._annotationFieldId = field.fieldId.getStringValue();
    return this;
  }

  // Method to set value directly
  withValue(value: AnnotationValue): this {
    this._value = value;
    // Clear props if value is set directly to avoid conflicts
    this._valueProps = {};
    this._valueType = "";
    return this;
  }

  // --- Convenience methods for setting value via props ---
  withDyadValue(value: number): this {
    this._valueType = "dyad";
    this._valueProps = { value };
    this._value = undefined; // Clear direct value
    return this;
  }

  withTriadValue(values: {
    vertexA: number;
    vertexB: number;
    vertexC: number;
  }): this {
    this._valueType = "triad";
    this._valueProps = values;
    this._value = undefined;
    return this;
  }

  withRatingValue(stars: number): this {
    this._valueType = "rating";
    this._valueProps = { rating: stars };
    this._value = undefined;
    return this;
  }

  withSingleSelectValue(option: string): this {
    this._valueType = "singleSelect";
    this._valueProps = { option };
    this._value = undefined;
    return this;
  }

  withMultiSelectValue(options: string[]): this {
    this._valueType = "multiSelect";
    this._valueProps = { options };
    this._value = undefined;
    return this;
  }
  // --- End convenience methods ---

  withAnnotationTemplateIds(templateIds: string[]): this {
    this._annotationTemplateIds = templateIds;
    return this;
  }

  withAnnotationTemplateId(templateId: string): this {
    this._annotationTemplateIds = [templateId];
    return this;
  }

  withNote(note: string): this {
    this._note = note;
    return this;
  }

  withCreatedAt(date: Date): this {
    this._createdAt = date;
    return this;
  }

  withPublishedRecordId(recordId: PublishedRecordIdProps): this {
    this._publishedRecordId = recordId;
    return this;
  }

  // Method to build the Annotation aggregate
  build(): Result<Annotation> {
    const curatorIdResult = CuratorId.create(this._curatorId);
    const urlResult = new URI(this._url);
    
    // Get or create the annotation field
    let annotationField: AnnotationField;
    if (this._annotationField) {
      annotationField = this._annotationField;
    } else {
      // If we don't have a field object but have an ID, we need to fail
      // since we now require the full field object
      return err(
        new Error("AnnotationField object is required. Use withAnnotationField() instead of withAnnotationFieldId().")
      );
    }

    // Create value based on type if not directly set
    let valueResult: AnnotationValue;
    if (this._value) {
      valueResult = this._value;
    } else {
      // Use AnnotationValueFactory with the field's type information
      const fieldType = annotationField.definition.type;
      const factoryResult = AnnotationValueFactory.create({
        type: fieldType,
        valueInput: this._valueProps,
      });

      if (factoryResult.isErr()) {
        return err(
          new Error(`Value creation failed: ${factoryResult.error}`)
        );
      }

      valueResult = factoryResult.value;
    }

    // Create template IDs if any
    const templateIds = this._annotationTemplateIds.map((id) =>
      AnnotationTemplateId.create(new UniqueEntityID(id)).unwrap()
    );

    // Create note if provided
    let note: AnnotationNote | undefined;
    if (this._note) {
      note = AnnotationNote.create(this._note);
    }

    // Create published record ID if provided
    let publishedRecordId: PublishedRecordId | undefined;
    if (this._publishedRecordId) {
      publishedRecordId = PublishedRecordId.create(this._publishedRecordId);
    }

    // Check for errors in required value objects
    if (curatorIdResult.isErr()) {
      return err(
        new Error(`CuratorId creation failed: ${curatorIdResult.error}`)
      );
    }

    const props: AnnotationProps = {
      curatorId: curatorIdResult.value,
      url: urlResult,
      annotationField: annotationField,
      value: valueResult,
      annotationTemplateIds: templateIds.length > 0 ? templateIds : undefined,
      note,
      createdAt: this._createdAt,
      publishedRecordId,
    };

    // Create the annotation
    const annotationResult = Annotation.create(props, this._id);

    if (annotationResult.isErr()) {
      return err(
        new Error(`Annotation creation failed: ${annotationResult.error}`)
      );
    }

    return ok(annotationResult.value);
  }

  // Convenience method to build and unwrap, throwing on error (useful in tests)
  buildOrThrow(): Annotation {
    const result = this.build();
    if (result.isErr()) {
      throw result.error;
    }
    return result.value;
  }
}
