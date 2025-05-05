import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import postgres from "postgres";
import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { DrizzleAnnotationRepository } from "../DrizzleAnnotationRepository";
import { DrizzleAnnotationFieldRepository } from "../DrizzleAnnotationFieldRepository";
import { DrizzleAnnotationTemplateRepository } from "../DrizzleAnnotationTemplateRepository";
import {
  AnnotationId,
  CuratorId,
  PublishedRecordId,
} from "../../../domain/value-objects";
import { UniqueEntityID } from "../../../../../shared/domain/UniqueEntityID";
import { sql } from "drizzle-orm";
import { annotations, annotationToTemplates } from "../schema/annotationSchema";
import { AnnotationBuilder } from "../../../tests/utils/builders/AnnotationBuilder";
import { URI } from "../../../domain/value-objects/URI";
import { AnnotationField } from "../../../domain/aggregates";
import {
  AnnotationFieldName,
  AnnotationFieldDescription,
} from "../../../domain/value-objects";
import { AnnotationFieldDefinitionFactory } from "../../../domain/AnnotationFieldDefinitionFactory";
import { AnnotationType } from "../../../domain/value-objects/AnnotationType";
import { AnnotationTemplate } from "../../../domain/aggregates/AnnotationTemplate";
import { AnnotationTemplateName } from "../../../domain/value-objects/AnnotationTemplateName";
import { AnnotationTemplateDescription } from "../../../domain/value-objects/AnnotationTemplateDescription";
import { AnnotationTemplateField } from "../../../domain/value-objects";
import { AnnotationTemplateFields } from "../../../domain/value-objects/AnnotationTemplateFields";

describe("DrizzleAnnotationRepository", () => {
  let container: StartedPostgreSqlContainer;
  let db: PostgresJsDatabase;
  let fieldRepository: DrizzleAnnotationFieldRepository;
  let templateRepository: DrizzleAnnotationTemplateRepository;
  let annotationRepository: DrizzleAnnotationRepository;

  // Test data
  let testField: AnnotationField;
  let testTemplate: AnnotationTemplate;
  let curatorId: CuratorId;

  // Setup before all tests
  beforeAll(async () => {
    // Start PostgreSQL container
    container = await new PostgreSqlContainer().start();

    // Create database connection
    const connectionString = container.getConnectionUri();
    process.env.DATABASE_URL = connectionString;
    const client = postgres(connectionString);
    db = drizzle(client);

    // Create repositories
    fieldRepository = new DrizzleAnnotationFieldRepository(db);
    templateRepository = new DrizzleAnnotationTemplateRepository(
      db,
      fieldRepository
    );
    annotationRepository = new DrizzleAnnotationRepository(db, fieldRepository);

    // Create schema using drizzle schema definitions
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS published_records (
        id UUID PRIMARY KEY,
        uri TEXT NOT NULL,
        cid TEXT NOT NULL,
        recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        UNIQUE(uri, cid)
      );

      CREATE TABLE IF NOT EXISTS annotation_fields (
        id TEXT PRIMARY KEY,
        curator_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        definition_type TEXT NOT NULL,
        definition_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        published_record_id UUID REFERENCES published_records(id)
      );

      CREATE TABLE IF NOT EXISTS annotation_templates (
        id UUID PRIMARY KEY,
        curator_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        published_record_id UUID REFERENCES published_records(id)
      );

      CREATE TABLE IF NOT EXISTS annotation_template_fields (
        id UUID PRIMARY KEY,
        template_id UUID NOT NULL REFERENCES annotation_templates(id) ON DELETE CASCADE,
        field_id UUID NOT NULL,
        required BOOLEAN NOT NULL DEFAULT false
      );

      CREATE TABLE IF NOT EXISTS annotations (
        id TEXT PRIMARY KEY,
        curator_id TEXT NOT NULL,
        url TEXT NOT NULL,
        annotation_field_id TEXT NOT NULL,
        value_type TEXT NOT NULL,
        value_data JSONB NOT NULL,
        note TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        published_record_id UUID REFERENCES published_records(id)
      );

      CREATE TABLE IF NOT EXISTS annotation_to_templates (
        id UUID PRIMARY KEY,
        annotation_id TEXT NOT NULL REFERENCES annotations(id) ON DELETE CASCADE,
        template_id UUID NOT NULL REFERENCES annotation_templates(id) ON DELETE CASCADE
      );
    `);

    // Create test data
    curatorId = CuratorId.create("did:plc:testcurator").unwrap();

    // Create a test annotation field
    const fieldId = new UniqueEntityID();
    const fieldName = AnnotationFieldName.create("Test Rating Field").unwrap();
    const fieldDescription = AnnotationFieldDescription.create(
      "A field for rating content"
    ).unwrap();

    // Create a rating field definition
    const fieldDefinition = AnnotationFieldDefinitionFactory.create({
      type: AnnotationType.create("rating"),
      fieldDefProps: {
        numberOfStars: 5,
      },
    }).unwrap();

    // Create the annotation field
    testField = AnnotationField.create(
      {
        curatorId,
        name: fieldName,
        description: fieldDescription,
        definition: fieldDefinition,
      },
      fieldId
    ).unwrap();

    // Save the field
    await fieldRepository.save(testField);

    // Create a template field using the annotation field
    const templateField = AnnotationTemplateField.create({
      annotationField: testField,
      required: true,
    }).unwrap();

    // Create template fields collection
    const templateFields = AnnotationTemplateFields.create([
      templateField,
    ]).unwrap();

    // Create the template
    const templateId = new UniqueEntityID();
    const templateName =
      AnnotationTemplateName.create("Rating Template").unwrap();
    const templateDescription = AnnotationTemplateDescription.create(
      "A template for rating content"
    ).unwrap();

    testTemplate = AnnotationTemplate.create(
      {
        curatorId,
        name: templateName,
        description: templateDescription,
        annotationTemplateFields: templateFields,
      },
      templateId
    ).unwrap();

    // Save the template
    await templateRepository.save(testTemplate);
  }, 60000); // Increase timeout for container startup

  // Cleanup after all tests
  afterAll(async () => {
    // Stop container
    await container.stop();
  });

  // Clear data between tests
  beforeEach(async () => {
    await db.delete(annotationToTemplates);
    await db.delete(annotations);
  });

  it("should save and retrieve an annotation", async () => {
    // Create a test annotation
    const annotationId = new UniqueEntityID();
    const url = new URI("https://example.com/article1");

    const annotation = new AnnotationBuilder()
      .withId(annotationId)
      .withCuratorId(curatorId.value)
      .withUrl(url.value)
      .withAnnotationField(testField)
      .withRatingValue(4)
      .withNote("This is a great article")
      .buildOrThrow();

    // Save the annotation
    await annotationRepository.save(annotation);

    // Retrieve the annotation
    const retrievedAnnotation = await annotationRepository.findById(
      AnnotationId.create(new UniqueEntityID(annotationId.toString())).unwrap()
    );

    // Verify annotation was retrieved correctly
    expect(retrievedAnnotation).not.toBeNull();
    expect(retrievedAnnotation?.annotationId.getStringValue()).toBe(
      annotationId.toString()
    );
    expect(retrievedAnnotation?.url.value).toBe("https://example.com/article1");
    expect(retrievedAnnotation?.note?.getValue()).toBe(
      "This is a great article"
    );

    // Verify the value was retrieved correctly
    expect(retrievedAnnotation?.value.type.value).toBe("rating");
    // @ts-ignore - We know this is a RatingValue
    expect(retrievedAnnotation?.value.rating).toBe(4);
  });

  it("should save and retrieve an annotation with template associations", async () => {
    // Create a test annotation with template
    const annotationId = new UniqueEntityID();
    const url = new URI("https://example.com/article2");

    const annotation = new AnnotationBuilder()
      .withId(annotationId)
      .withCuratorId(curatorId.value)
      .withUrl(url.value)
      .withAnnotationField(testField)
      .withRatingValue(5)
      .withAnnotationTemplateIds([testTemplate.id.toString()])
      .buildOrThrow();

    // Save the annotation
    await annotationRepository.save(annotation);
    const annotationIdResult = AnnotationId.create(annotationId);
    if (annotationIdResult.isErr()) {
      throw new Error("Failed to create AnnotationId");
    }
    const annotationIdValue = annotationIdResult.unwrap();

    // Retrieve the annotation
    const retrievedAnnotation =
      await annotationRepository.findById(annotationIdValue);

    // Verify annotation was retrieved correctly
    expect(retrievedAnnotation).not.toBeNull();
    expect(retrievedAnnotation?.annotationTemplateIds).toBeDefined();
    expect(retrievedAnnotation?.annotationTemplateIds?.length).toBe(1);
    expect(
      retrievedAnnotation?.annotationTemplateIds?.[0]?.getValue().toString()
    ).toBe(testTemplate.id.toString());
  });

  it("should update an existing annotation", async () => {
    // Create a test annotation
    const annotationId = new UniqueEntityID();
    const url = new URI("https://example.com/article3");

    const annotation = new AnnotationBuilder()
      .withId(annotationId)
      .withCuratorId(curatorId.value)
      .withUrl(url.value)
      .withAnnotationField(testField)
      .withRatingValue(3)
      .buildOrThrow();

    // Save the annotation
    await annotationRepository.save(annotation);

    // Update the annotation
    const updatedAnnotation = new AnnotationBuilder()
      .withId(annotationId)
      .withCuratorId(curatorId.value)
      .withUrl(url.value)
      .withAnnotationField(testField)
      .withRatingValue(5)
      .withNote("Updated my rating")
      .buildOrThrow();

    await annotationRepository.save(updatedAnnotation);

    // Retrieve the updated annotation
    const retrievedAnnotation = await annotationRepository.findById(
      AnnotationId.create(new UniqueEntityID(annotationId.toString())).unwrap()
    );

    // Verify annotation was updated correctly
    expect(retrievedAnnotation).not.toBeNull();
    // @ts-ignore - We know this is a RatingValue
    expect(retrievedAnnotation?.value.rating).toBe(5);
    expect(retrievedAnnotation?.note?.getValue()).toBe("Updated my rating");
  });

  it("should delete an annotation", async () => {
    // Create a test annotation
    const annotationId = new UniqueEntityID();
    const url = new URI("https://example.com/article4");

    const annotation = new AnnotationBuilder()
      .withId(annotationId)
      .withCuratorId(curatorId.value)
      .withUrl(url.value)
      .withAnnotationField(testField)
      .withRatingValue(2)
      .buildOrThrow();

    // Save the annotation
    await annotationRepository.save(annotation);

    // Delete the annotation
    await annotationRepository.delete(
      AnnotationId.create(new UniqueEntityID(annotationId.toString())).unwrap()
    );

    // Try to retrieve the deleted annotation
    const retrievedAnnotation = await annotationRepository.findById(
      AnnotationId.create(new UniqueEntityID(annotationId.toString())).unwrap()
    );

    // Verify annotation was deleted
    expect(retrievedAnnotation).toBeNull();
  });

  it("should find annotations by URL", async () => {
    // Create multiple annotations with the same URL
    const url = new URI("https://example.com/shared-article");

    const annotation1 = new AnnotationBuilder()
      .withCuratorId(curatorId.value)
      .withUrl(url.value)
      .withAnnotationField(testField)
      .withRatingValue(4)
      .withNote("First annotation")
      .buildOrThrow();

    const annotation2 = new AnnotationBuilder()
      .withCuratorId(curatorId.value)
      .withUrl(url.value)
      .withAnnotationField(testField)
      .withRatingValue(5)
      .withNote("Second annotation")
      .buildOrThrow();

    // Save the annotations
    await annotationRepository.save(annotation1);
    await annotationRepository.save(annotation2);

    // Find annotations by URL
    const foundAnnotations = await annotationRepository.findByUrl(url);

    // Verify annotations were found
    expect(foundAnnotations.length).toBe(2);

    // Verify the annotations have the correct notes
    const notes = foundAnnotations.map((a) => a.note?.getValue());
    expect(notes).toContain("First annotation");
    expect(notes).toContain("Second annotation");
  });

  it("should find an annotation by published record id", async () => {
    // Create a test annotation with a published record ID
    const annotationId = new UniqueEntityID();
    const url = new URI("https://example.com/article5");
    const publishedUri = "at://did:plc:testcurator/app.annos.annotation/1234";
    const publishedCid =
      "bafyreihgmyh2srmmyj7g7vmah3ietpwdwcgda2jof7hkfxmcbbjwejnqwu";
    const publishedRecordId = PublishedRecordId.create({
      uri: publishedUri,
      cid: publishedCid,
    });

    const annotation = new AnnotationBuilder()
      .withId(annotationId)
      .withCuratorId(curatorId.value)
      .withUrl(url.value)
      .withAnnotationField(testField)
      .withRatingValue(5)
      .withPublishedRecordId({ uri: publishedUri, cid: publishedCid })
      .buildOrThrow();

    // Save the annotation
    await annotationRepository.save(annotation);

    // Find annotation by URI
    const foundAnnotation =
      await annotationRepository.findByPublishedRecordId(publishedRecordId);

    expect(foundAnnotation).not.toBeNull();
    expect(foundAnnotation?.annotationId.getStringValue()).toBe(
      annotationId.toString()
    );
    expect(foundAnnotation?.publishedRecordId?.uri).toBe(publishedUri);
    expect(foundAnnotation?.publishedRecordId?.cid).toBe(publishedCid);
  });
});
