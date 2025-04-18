import { CreateAnnotationFieldUseCase } from "../../../../src/annotations/application/use-cases/CreateAnnotationFieldUseCase";
import { IAnnotationFieldRepository } from "../../../../src/annotations/application/repositories/IAnnotationFieldRepository";
import { AnnotationField } from "../../../../src/annotations/domain/aggregates/AnnotationField";
import { AnnotationFieldInputDTO } from "../../../../src/annotations/application/dtos/AnnotationFieldDTO";
import { DyadFieldDef } from "../../../../src/annotations/domain/value-objects/FieldDefinition";
import { TID } from "../../../../src/atproto/domain/value-objects/TID";
import { InMemoryAnnotationFieldRepository } from "../../../infrastructure/persistence/InMemoryAnnotationFieldRepository"; // Import the in-memory repo

// Mock the mapper (static methods) - Still needed as the use case uses it
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
  let inMemoryRepo: InMemoryAnnotationFieldRepository;

  beforeEach(() => {
    // Reset mocks and repo before each test
    jest.clearAllMocks(); // Clear mapper mock
    inMemoryRepo = new InMemoryAnnotationFieldRepository(); // Create fresh repo
    createAnnotationFieldUseCase = new CreateAnnotationFieldUseCase(
      inMemoryRepo // Use the in-memory repo instance
    );
  });

  it("should create and save an annotation field in the repository", async () => {
    const input: AnnotationFieldInputDTO = {
      name: "Test Dyad Field",
      description: "A field for testing dyads",
      definition: {
        $type: "app.annos.annotationField#dyadFieldDef",
        sideA: "Left",
        sideB: "Right",
      },
    };

    // No need to mock repo.save anymore

    const result = await createAnnotationFieldUseCase.execute(input);

    // 1. Verify the field was saved in the in-memory repository
    const savedField = await inMemoryRepo.findById(TID.fromString(result.id)); // Fetch by ID from result DTO
    expect(savedField).not.toBeNull();
    expect(savedField).toBeInstanceOf(AnnotationField); // Check instance type
    expect(savedField!.name).toBe(input.name);
    expect(savedField!.description).toBe(input.description);
    expect(savedField!.definition).toBeInstanceOf(DyadFieldDef);
    expect((savedField!.definition as DyadFieldDef).sideA).toBe(
      input.definition.sideA
    );
    expect((savedField!.definition as DyadFieldDef).sideB).toBe(
      input.definition.sideB
    );
    expect(savedField!.id).toBeInstanceOf(TID); // Check if an ID was generated

    // 2. Verify the returned DTO matches the input and generated data
    expect(result).toBeDefined();
    expect(result.id).toEqual(savedField!.id.toString()); // Compare with the ID of the saved field
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

    // Verify nothing was saved
    const fields = (inMemoryRepo as any).fields as Map<string, AnnotationField>; // Access private member for test
    expect(fields.size).toBe(0);
  });

  // Add more tests for:
  // - Different definition types (Triad, Rating, etc.)
  // - Input validation errors (e.g., empty name, handled by Aggregate/VOs)
  // - Repository errors during save
});
