import { UniqueEntityID } from "../../../../shared/domain/UniqueEntityID";
import { Result, ok, err } from "../../../../shared/core/Result";
import {
  Annotation,
  AnnotationProps,
} from "../../domain/aggregates/Annotation";
import {
  AnnotationFieldId,
  AnnotationNote,
  AnnotationTemplateId,
  AnnotationValue,
  CuratorId,
  PublishedRecordId,
  URI,
} from "../../domain/value-objects";
import {
  DyadValue,
  TriadValue,
  RatingValue,
  SingleSelectValue,
  MultiSelectValue,
} from "../../domain/value-objects/AnnotationValue";

export class AnnotationBuilder {
  private _id?: UniqueEntityID;
  private _curatorId: string = "did:plc:defaultCurator";
  private _url: string = "https://example.com/resource";
  private _annotationFieldId: string = "default-field-id";
  private _value?: AnnotationValue; // Will be set based on type
  private _valueProps: any = {}; // For storing value props before creating value
  private _valueType: string = "dyad"; // Default value type
  private _annotationTemplateIds: string[] = [];
  private _note?: string;
  private _createdAt?: Date;
  private _publishedRecordId?: string;

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

  withAnnotationFieldId(fieldId: string): this {
    this._annotationFieldId = fieldId;
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
  withDyadValue(sideA: number, sideB: number): this {
    this._valueType = "dyad";
    this._valueProps = { sideA, sideB };
    this._value = undefined; // Clear direct value
    return this;
  }

  withTriadValue(vertexA: number, vertexB: number, vertexC: number): this {
    this._valueType = "triad";
    this._valueProps = { vertexA, vertexB, vertexC };
    this._value = undefined;
    return this;
  }

  withRatingValue(stars: number): this {
    this._valueType = "rating";
    this._valueProps = { stars };
    this._value = undefined;
    return this;
  }

  withSingleSelectValue(selected: string): this {
    this._valueType = "singleSelect";
    this._valueProps = { selected };
    this._value = undefined;
    return this;
  }

  withMultiSelectValue(selected: string[]): this {
    this._valueType = "multiSelect";
    this._valueProps = { selected };
    this._value = undefined;
    return this;
  }
  // --- End convenience methods ---

  withAnnotationTemplateIds(templateIds: string[]): this {
    this._annotationTemplateIds = templateIds;
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

  withPublishedRecordId(recordId: string): this {
    this._publishedRecordId = recordId;
    return this;
  }

  // Method to build the Annotation aggregate
  build(): Result<Annotation> {
    const curatorIdResult = CuratorId.create(this._curatorId);
    const urlResult = new URI(this._url);
    const fieldIdResult = AnnotationFieldId.create(
      new UniqueEntityID(this._annotationFieldId)
    );

    // Create value based on type if not directly set
    let valueResult: AnnotationValue;
    if (this._value) {
      valueResult = this._value;
    } else {
      // Create value based on type and props
      switch (this._valueType) {
        case "dyad":
          valueResult = DyadValue.create(this._valueProps);
          break;
        case "triad":
          valueResult = TriadValue.create(this._valueProps);
          break;
        case "rating":
          valueResult = RatingValue.create(this._valueProps);
          break;
        case "singleSelect":
          valueResult = SingleSelectValue.create(this._valueProps);
          break;
        case "multiSelect":
          valueResult = MultiSelectValue.create(this._valueProps);
          break;
        default:
          return err(new Error("Invalid or missing value type"));
      }
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
    if (fieldIdResult.isErr()) {
      return err(
        new Error(`AnnotationFieldId creation failed: ${fieldIdResult.error}`)
      );
    }

    const props: AnnotationProps = {
      curatorId: curatorIdResult.value,
      url: urlResult,
      annotationFieldId: fieldIdResult.value,
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
