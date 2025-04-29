import { PostgreSqlContainer } from 'testcontainers';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DrizzleAnnotationFieldRepository } from '../DrizzleAnnotationFieldRepository';
import { AnnotationFieldId, CuratorId } from '../../../domain/value-objects';
import { AnnotationField } from '../../../domain/AnnotationField';
import { UniqueEntityID } from '../../../../../shared/domain/UniqueEntityID';
import { AnnotationFieldName } from '../../../domain/value-objects/AnnotationFieldName';
import { AnnotationFieldDescription } from '../../../domain/value-objects/AnnotationFieldDescription';
import { AnnotationFieldDefinition } from '../../../domain/value-objects/AnnotationFieldDefinition';
import { sql } from 'drizzle-orm';
import { annotationFields } from '../schema/annotationFieldSchema';

describe('DrizzleAnnotationFieldRepository', () => {
  let container: PostgreSqlContainer;
  let db: ReturnType<typeof drizzle>;
  let repository: DrizzleAnnotationFieldRepository;

  // Setup before all tests
  beforeAll(async () => {
    // Start PostgreSQL container
    container = await new PostgreSqlContainer().start();
    
    // Create database connection
    const connectionString = container.getConnectionUri();
    const client = postgres(connectionString);
    db = drizzle(client);
    
    // Create repository instance
    repository = new DrizzleAnnotationFieldRepository(db);
    
    // Create schema
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS annotation_fields (
        id TEXT PRIMARY KEY,
        curator_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        definition_type TEXT NOT NULL,
        definition_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        published_record_id TEXT
      );
    `);
  }, 60000); // Increase timeout for container startup

  // Cleanup after all tests
  afterAll(async () => {
    // Stop container
    await container.stop();
  });

  // Clear data between tests
  beforeEach(async () => {
    await db.delete(annotationFields);
  });

  // Basic test to verify repository can save and retrieve a field
  it('should save and retrieve an annotation field', async () => {
    // Create a test annotation field
    const id = new UniqueEntityID('test-id-123');
    const curatorId = CuratorId.create('did:plc:testcurator').unwrap();
    const name = AnnotationFieldName.create('Test Field').unwrap();
    const description = AnnotationFieldDescription.create('Test description').unwrap();
    const definition = AnnotationFieldDefinition.createDyad({
      sideA: 'Left',
      sideB: 'Right'
    }).unwrap();
    
    const field = AnnotationField.create({
      curatorId,
      name,
      description,
      definition
    }, id).unwrap();

    // Save the field
    await repository.save(field);

    // Retrieve the field
    const fieldId = AnnotationFieldId.create(id).unwrap();
    const retrievedField = await repository.findById(fieldId);

    // Verify field was retrieved correctly
    expect(retrievedField).not.toBeNull();
    expect(retrievedField?.fieldId.getStringValue()).toBe(fieldId.getStringValue());
    expect(retrievedField?.name.value).toBe('Test Field');
    expect(retrievedField?.description.value).toBe('Test description');
  });

  // Simple test for findByName
  it('should find a field by name', async () => {
    // Create and save a test field
    const id = new UniqueEntityID('test-id-456');
    const curatorId = CuratorId.create('did:plc:testcurator').unwrap();
    const name = AnnotationFieldName.create('Unique Field Name').unwrap();
    const description = AnnotationFieldDescription.create('Test description').unwrap();
    const definition = AnnotationFieldDefinition.createDyad({
      sideA: 'Left',
      sideB: 'Right'
    }).unwrap();
    
    const field = AnnotationField.create({
      curatorId,
      name,
      description,
      definition
    }, id).unwrap();

    await repository.save(field);

    // Find by name
    const retrievedField = await repository.findByName('Unique Field Name');

    // Verify field was found
    expect(retrievedField).not.toBeNull();
    expect(retrievedField?.fieldId.getStringValue()).toBe(id.toString());
  });
});
