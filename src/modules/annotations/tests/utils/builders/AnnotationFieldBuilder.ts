import { UniqueEntityID } from "../../../../../shared/domain/UniqueEntityID";
import { Result, ok, err } from "../../../../../shared/core/Result";
import {
  AnnotationField,
  AnnotationFieldProps,
} from "../../../domain/AnnotationField";
import {
  AnnotationFieldDescription,
  CuratorId,
  PublishedRecordId,
  AnnotationFieldDefinition,
  DyadFieldDef,
  TriadFieldDef,
  RatingFieldDef,
  SingleSelectFieldDef,
  MultiSelectFieldDef,
  IDyadFieldDefProps,
  ITriadFieldDefProps,
  ISelectFieldDefProps,
} from "../../../domain/value-objects";
import { AnnotationFieldName } from "../../../domain/value-objects/AnnotationFieldName";

export class AnnotationFieldBuilder {
  private _id?: UniqueEntityID;
  private _curatorId: string = "did:plc:defaultCurator";
  private _name: string = "Default Field Name";
  private _description: string = "Default field description.";
  private _definitionProps: any = { sideA: "Left", sideB: "Right" }; // Default to Dyad
  private _definition?: AnnotationFieldDefinition; // Allow setting directly
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

  withName(name: string): this {
    this._name = name;
    return this;
  }

  withDescription(description: string): this {
    this._description = description;
    return this;
  }

  // Method to set definition directly
  withDefinition(definition: AnnotationFieldDefinition): this {
    this._definition = definition;
    // Clear props if definition is set directly to avoid conflicts
    this._definitionProps = undefined;
    return this;
  }

  // --- Convenience methods for setting definition via props ---
  withDyadDefinition(props: IDyadFieldDefProps): this {
    this._definitionProps = props;
    this._definition = undefined; // Clear direct definition
    return this;
  }

  withTriadDefinition(props: ITriadFieldDefProps): this {
    this._definitionProps = props;
    this._definition = undefined;
    return this;
  }

  withRatingDefinition(): this {
    // Rating has no props other than the fixed number of stars
    this._definitionProps = { numberOfStars: 5 };
    this._definition = undefined;
    return this;
  }

  withSingleSelectDefinition(props: ISelectFieldDefProps): this {
    this._definitionProps = props;
    this._definition = undefined;
    return this;
  }

  withMultiSelectDefinition(props: ISelectFieldDefProps): this {
    this._definitionProps = props;
    this._definition = undefined;
    return this;
  }
  // --- End convenience methods ---

  withCreatedAt(date: Date): this {
    this._createdAt = date;
    return this;
  }

  withPublishedRecordId(recordId: string): this {
    this._publishedRecordId = recordId;
    return this;
  }

  // Method to build the AnnotationField aggregate
  build(): Result<AnnotationField> {
    const curatorIdResult = CuratorId.create(this._curatorId);
    const nameResult = AnnotationFieldName.create(this._name);
    const descriptionResult = AnnotationFieldDescription.create(
      this._description
    );

    let definitionResult: Result<AnnotationFieldDefinition>;

    if (this._definition) {
      // Use directly set definition
      definitionResult = ok(this._definition);
    } else if (this._definitionProps) {
      // Attempt to create definition from props
      // This requires trying each type based on the props structure
      if ("sideA" in this._definitionProps) {
        definitionResult = DyadFieldDef.create(this._definitionProps);
      } else if ("vertexA" in this._definitionProps) {
        definitionResult = TriadFieldDef.create(this._definitionProps);
      } else if ("numberOfStars" in this._definitionProps) {
        definitionResult = RatingFieldDef.create(); // No props needed
      } else if ("options" in this._definitionProps) {
        // Try both select types - assumes structure is sufficient to distinguish
        // Or rely on a 'type' hint if added to builder state
        // For simplicity, let's assume SingleSelect first, then MultiSelect
        definitionResult = SingleSelectFieldDef.create(this._definitionProps);
        if (definitionResult.isErr()) {
          definitionResult = MultiSelectFieldDef.create(this._definitionProps);
        }
      } else {
        definitionResult = err(
          new Error("Could not determine definition type from props")
        );
      }
    } else {
      return err(new Error("AnnotationField definition not set in builder"));
    }

    let publishedRecordIdResult: Result<PublishedRecordId | undefined> =
      ok(undefined);
    const publishedRecordId = this._publishedRecordId
      ? PublishedRecordId.create(this._publishedRecordId)
      : undefined;
    if (
      curatorIdResult.isErr() ||
      nameResult.isErr() ||
      descriptionResult.isErr() ||
      definitionResult.isErr()
    ) {
      throw new Error("Failed to create one of the required properties");
    }

    const curatorId = curatorIdResult.value;
    const name = nameResult.value;
    const description = descriptionResult.value;
    const definition = definitionResult.value;

    const fieldProps: AnnotationFieldProps = {
      curatorId,
      name,
      description,
      definition,
      createdAt: this._createdAt, // Pass directly, AnnotationField.create handles default
      publishedRecordId, // Pass created VO or undefined
    };

    // Create the aggregate
    const fieldResult = AnnotationField.create(fieldProps, this._id);

    if (fieldResult.isErr()) {
      return err(
        new Error(
          `AnnotationField creation failed: ${fieldResult.error.message}`
        )
      );
    }

    return ok(fieldResult.value);
  }

  // Convenience method to build and unwrap, throwing on error (useful in tests)
  buildOrThrow(): AnnotationField {
    const result = this.build();
    if (result.isErr()) {
      throw result.error;
    }
    return result.value;
  }
}
