import { CreateAnnotationFieldUseCase } from "../../../../src/annotations/application/use-cases/CreateAnnotationFieldUseCase";
import { IAnnotationFieldRepository } from "../../../../src/annotations/application/repositories/IAnnotationFieldRepository";
import { AnnotationField } from "../../../../src/annotations/domain/aggregates/AnnotationField";
import { AnnotationFieldInputDTO } from "../../../../src/annotations/application/dtos/AnnotationFieldDTO";
import { DyadFieldDef } from "../../../../src/annotations/domain/value-objects/FieldDefinition";
import { TID } from "../../../../src/atproto/domain/value-objects/TID";

// Mock the repository
const mockFieldRepo: jest.Mocked<IAnnotationFieldRepository> = {
  findById: jest.fn(),
  findByUri: jest.fn(),
  findByName: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

// Mock the mapper (static methods)
// Adjust path if needed
jest.mock(
  "../../../../src/annotations/infrastructure/persistence/drizzle/mappers/AnnotationFieldMapper",
  () => ({
    AnnotationFieldMapper: {
      toDTO: jest.fn((field: AnnotationField) => ({
        id: field.id.toString(),
        name: field.name,
        description: field.description,
        definition: {
          // Simple mock mapping, adjust if complex logic needed
          $type: field.definition.$type,
          ...(field.definition instanceof DyadFieldDef && {
            sideA: field.definition.sideA,
            sideB: field.definition.sideB,
          }),
          // Add other definition types as needed for thorough tests
        },
        createdAt: field.createdAt.toISOString(),
      })),
      // Mock other methods if used (toDomain, etc.)
    },
  })
);

describe("CreateAnnotationFieldUseCase", () => {
  let createAnnotationFieldUseCase: CreateAnnotationFieldUseCase;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    createAnnotationFieldUseCase = new CreateAnnotationFieldUseCase(
      mockFieldRepo
    );
  });

  it("should create and save an annotation field", async () => {
    const input: AnnotationFieldInputDTO = {
      name: "Test Dyad Field",
      description: "A field for testing dyads",
      definition: {
        $type: "app.annos.annotationField#dyadFieldDef",
        sideA: "Left",
        sideB: "Right",
      },
    };

    // Mock the save operation to simulate successful persistence
    mockFieldRepo.save.mockResolvedValue(undefined);

    const result = await createAnnotationFieldUseCase.execute(input);

    // 1. Verify repository's save method was called correctly
    expect(mockFieldRepo.save).toHaveBeenCalledTimes(1);
    const savedField = mockFieldRepo.save.mock.calls[0][0] as AnnotationField;
    expect(savedField).toBeInstanceOf(AnnotationField);
    expect(savedField.name).toBe(input.name);
    expect(savedField.description).toBe(input.description);
    expect(savedField.definition).toBeInstanceOf(DyadFieldDef);
    expect((savedField.definition as DyadFieldDef).sideA).toBe(
      input.definition.sideA
    );
    expect((savedField.definition as DyadFieldDef).sideB).toBe(
      input.definition.sideB
    );
    expect(savedField.id).toBeInstanceOf(TID); // Check if an ID was generated

    // 2. Verify the returned DTO matches the input and generated data
    expect(result).toBeDefined();
    expect(result.id).toEqual(savedField.id.toString());
    expect(result.name).toBe(input.name);
    expect(result.description).toBe(input.description);
    expect(result.definition.$type).toBe(input.definition.$type);
    expect(result.definition.sideA).toBe(input.definition.sideA);
    expect(result.definition.sideB).toBe(input.definition.sideB);
    expect(result.createdAt).toBeDefined(); // Check if createdAt exists
  });

  it("should throw an error for invalid definition type", async () => {
    const input: AnnotationFieldInputDTO = {
      name: "Invalid Field",
      description: "A field with bad definition",
      definition: {
        $type: "app.annos.annotationField#unknownDef", // Invalid type
        someProp: "value",
      },
    };

    await expect(createAnnotationFieldUseCase.execute(input)).rejects.toThrow(
      "Invalid or unknown field definition type: app.annos.annotationField#unknownDef"
    );

    expect(mockFieldRepo.save).not.toHaveBeenCalled();
  });

  // Add more tests for:
  // - Different definition types (Triad, Rating, etc.)
  // - Input validation errors (e.g., empty name, handled by Aggregate/VOs)
  // - Repository errors during save
});
