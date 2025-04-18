import { GetAnnotationFieldUseCase } from '../../../../src/annotations/application/use-cases/GetAnnotationFieldUseCase'
import { IAnnotationFieldRepository } from '../../../../src/annotations/application/repositories/IAnnotationFieldRepository'
import { AnnotationField } from '../../../../src/annotations/domain/aggregates/AnnotationField'
import { RatingFieldDef } from '../../../../src/annotations/domain/value-objects/FieldDefinition'
import { TID } from '../../../../src/atproto/domain/value-objects/TID'

// Mock the repository
const mockFieldRepo: jest.Mocked<IAnnotationFieldRepository> = {
  findById: jest.fn(),
  findByUri: jest.fn(),
  findByName: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
}

// Mock the mapper (static methods)
// Adjust path if needed
jest.mock('../../../../src/annotations/infrastructure/persistence/drizzle/mappers/AnnotationFieldMapper', () => ({
  AnnotationFieldMapper: {
    toDTO: jest.fn((field: AnnotationField) => ({
      id: field.id.toString(),
      name: field.name,
      description: field.description,
      definition: {
        $type: field.definition.$type,
        // Add mock mapping for specific types if needed for assertions
      },
      createdAt: field.createdAt.toISOString(),
    })),
  },
}))

describe('GetAnnotationFieldUseCase', () => {
  let getAnnotationFieldUseCase: GetAnnotationFieldUseCase

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
    getAnnotationFieldUseCase = new GetAnnotationFieldUseCase(mockFieldRepo)
  })

  it('should return the annotation field DTO if found', async () => {
    const fieldId = TID.create()
    const mockField = AnnotationField.create({
      id: fieldId,
      name: 'Test Rating Field',
      description: 'A field for testing ratings',
      definition: new RatingFieldDef(), // Example definition
    })

    // Mock the repository to return the field
    mockFieldRepo.findById.mockResolvedValue(mockField)

    const result = await getAnnotationFieldUseCase.execute(fieldId)

    // 1. Verify repository's findById was called correctly
    expect(mockFieldRepo.findById).toHaveBeenCalledTimes(1)
    expect(mockFieldRepo.findById).toHaveBeenCalledWith(fieldId)

    // 2. Verify the mapper was called
    // Cannot directly assert on the static mock call count easily without more setup,
    // but we can verify the result which implies the mapper was called.

    // 3. Verify the returned DTO matches the mock field data
    expect(result).toBeDefined()
    expect(result?.id).toBe(fieldId.toString())
    expect(result?.name).toBe(mockField.name)
    expect(result?.description).toBe(mockField.description)
    expect(result?.definition.$type).toBe(mockField.definition.$type)
    expect(result?.createdAt).toBe(mockField.createdAt.toISOString())
  })

  it('should return null if the annotation field is not found', async () => {
    const fieldId = TID.create()

    // Mock the repository to return null (not found)
    mockFieldRepo.findById.mockResolvedValue(null)

    const result = await getAnnotationFieldUseCase.execute(fieldId)

    // 1. Verify repository's findById was called correctly
    expect(mockFieldRepo.findById).toHaveBeenCalledTimes(1)
    expect(mockFieldRepo.findById).toHaveBeenCalledWith(fieldId)

    // 2. Verify the result is null
    expect(result).toBeNull()
  })

  // Add more tests for:
  // - Repository errors during findById
})
