import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import postgres from "postgres";
import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { DrizzleAnnotationFieldRepository } from "../DrizzleAnnotationFieldRepository";
import { AnnotationFieldId, CuratorId } from "../../../domain/value-objects";
import { AnnotationField } from "../../../domain/AnnotationField";
import { UniqueEntityID } from "../../../../../shared/domain/UniqueEntityID";
import { AnnotationFieldName } from "../../../domain/value-objects/AnnotationFieldName";
import { AnnotationFieldDescription } from "../../../domain/value-objects/AnnotationFieldDescription";
import { sql } from "drizzle-orm";
import { annotationFields } from "../schema/annotationFieldSchema";
import { AnnotationFieldDefinitionFactory } from "src/modules/annotations/domain/AnnotationFieldDefinitionFactory";
import { AnnotationType } from "src/modules/annotations/domain/value-objects/AnnotationType";
import { PublishedRecordId } from "../../../domain/value-objects/PublishedRecordId";

describe("DrizzleAnnotationFieldRepository", () => {
  let container: StartedPostgreSqlContainer;
  let db: PostgresJsDatabase;
  let repository: DrizzleAnnotationFieldRepository;

  // Setup before all tests
  beforeAll(async () => {
    // Start PostgreSQL container
    container = await new PostgreSqlContainer().start();

    // Create database connection
    const connectionString = container.getConnectionUri();
    process.env.DATABASE_URL = connectionString;
    const client = postgres(connectionString);
    db = drizzle(client);

    // Create repository instance
    repository = new DrizzleAnnotationFieldRepository(db);

    // Create schema
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS annotation_fields (
        id UUID PRIMARY KEY,
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
  it("should save and retrieve an annotation field", async () => {
    // Create a test annotation field
    const id = new UniqueEntityID();
    const curatorId = CuratorId.create("did:plc:testcurator").unwrap();
    const name = AnnotationFieldName.create("Test Field").unwrap();
    const description = AnnotationFieldDescription.create("Test description").unwrap();
    
    // Create a dyad field definition using the factory
    const fieldDefinition = AnnotationFieldDefinitionFactory.create({
      type: AnnotationType.create("dyad"),
      fieldDefProps: {
        sideA: "Left",
        sideB: "Right"
      },
    }).unwrap();
    
    const field = AnnotationField.create({
      curatorId,
      name,
      description,
      definition: fieldDefinition
    }, id).unwrap();

    // Save the field
    await repository.save(field);

    // Retrieve the field
    const fieldId = AnnotationFieldId.create(id).unwrap();
    const retrievedField = await repository.findById(fieldId);

    // Verify field was retrieved correctly
    expect(retrievedField).not.toBeNull();
    expect(retrievedField?.fieldId.getStringValue()).toBe(fieldId.getStringValue());
    expect(retrievedField?.name.value).toBe("Test Field");
    expect(retrievedField?.description.value).toBe("Test description");
    expect(retrievedField?.definition.type).toBe(AnnotationType.DYAD);
  });

  // Test for findByName
  it("should find a field by name", async () => {
    // Create and save a test field
    const id = new UniqueEntityID();
    const curatorId = CuratorId.create("did:plc:testcurator").unwrap();
    const name = AnnotationFieldName.create("Unique Field Name").unwrap();
    const description = AnnotationFieldDescription.create("Test description").unwrap();
    
    const fieldDefinition = AnnotationFieldDefinitionFactory.create({
      type: AnnotationType.create("dyad"),
      fieldDefProps: {
        sideA: "Left",
        sideB: "Right"
      },
    }).unwrap();
    
    const field = AnnotationField.create({
      curatorId,
      name,
      description,
      definition: fieldDefinition
    }, id).unwrap();

    await repository.save(field);

    // Find by name
    const retrievedField = await repository.findByName("Unique Field Name");

    // Verify field was found
    expect(retrievedField).not.toBeNull();
    expect(retrievedField?.fieldId.getStringValue()).toBe(id.toString());
    expect(retrievedField?.name.value).toBe("Unique Field Name");
  });

  // Test for findByPublishedRecordId
  it("should find a field by published record ID", async () => {
    // Create and save a test field with a published record ID
    const id = new UniqueEntityID();
    const curatorId = CuratorId.create("did:plc:testcurator").unwrap();
    const name = AnnotationFieldName.create("Published Field").unwrap();
    const description = AnnotationFieldDescription.create("Field with published ID").unwrap();
    const publishedRecordId = PublishedRecordId.create("at://did:plc:testcurator/app.annos.annotationField/test-record");
    
    const fieldDefinition = AnnotationFieldDefinitionFactory.create({
      type: AnnotationType.create("rating"),
      fieldDefProps: {
        numberOfStars: 5
      },
    }).unwrap();
    
    const field = AnnotationField.create({
      curatorId,
      name,
      description,
      definition: fieldDefinition,
      publishedRecordId
    }, id).unwrap();

    await repository.save(field);

    // Find by published record ID
    const retrievedField = await repository.findByPublishedRecordId(publishedRecordId);

    // Verify field was found
    expect(retrievedField).not.toBeNull();
    expect(retrievedField?.fieldId.getStringValue()).toBe(id.toString());
    expect(retrievedField?.publishedRecordId?.getValue()).toBe(publishedRecordId.getValue());
  });

  // Test for delete
  it("should delete a field", async () => {
    // Create and save a test field
    const id = new UniqueEntityID();
    const curatorId = CuratorId.create("did:plc:testcurator").unwrap();
    const name = AnnotationFieldName.create("Field To Delete").unwrap();
    const description = AnnotationFieldDescription.create("This field will be deleted").unwrap();
    
    const fieldDefinition = AnnotationFieldDefinitionFactory.create({
      type: AnnotationType.create("triad"),
      fieldDefProps: {
        vertexA: "Vertex A",
        vertexB: "Vertex B",
        vertexC: "Vertex C"
      },
    }).unwrap();
    
    const field = AnnotationField.create({
      curatorId,
      name,
      description,
      definition: fieldDefinition
    }, id).unwrap();

    await repository.save(field);

    // Verify field exists
    const fieldId = AnnotationFieldId.create(id).unwrap();
    let retrievedField = await repository.findById(fieldId);
    expect(retrievedField).not.toBeNull();

    // Delete the field
    await repository.delete(fieldId);

    // Verify field was deleted
    retrievedField = await repository.findById(fieldId);
    expect(retrievedField).toBeNull();
  });
});
