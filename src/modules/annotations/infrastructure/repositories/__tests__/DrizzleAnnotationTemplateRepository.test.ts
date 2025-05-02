import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import postgres from "postgres";
import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { DrizzleAnnotationTemplateRepository } from "../DrizzleAnnotationTemplateRepository";
import { DrizzleAnnotationFieldRepository } from "../DrizzleAnnotationFieldRepository";
import {
  AnnotationFieldDescription,
  AnnotationFieldName,
  AnnotationTemplateField,
  AnnotationTemplateId,
  CuratorId,
} from "../../../domain/value-objects";
import { AnnotationTemplate } from "../../../domain/aggregates/AnnotationTemplate";
import { UniqueEntityID } from "../../../../../shared/domain/UniqueEntityID";
import { AnnotationTemplateName } from "../../../domain/value-objects/AnnotationTemplateName";
import { AnnotationTemplateDescription } from "../../../domain/value-objects/AnnotationTemplateDescription";
import { AnnotationTemplateFields } from "../../../domain/value-objects/AnnotationTemplateFields";
import { sql } from "drizzle-orm";
import {
  annotationTemplates,
  annotationTemplateFields,
} from "../schema/annotationTemplateSchema";
import { annotationFields } from "../schema/annotationFieldSchema";
import { AnnotationFieldDefinitionFactory } from "src/modules/annotations/domain/AnnotationFieldDefinitionFactory";
import { AnnotationType } from "src/modules/annotations/domain/value-objects/AnnotationType";
import { AnnotationField } from "src/modules/annotations/domain/aggregates";

describe("DrizzleAnnotationTemplateRepository", () => {
  let container: StartedPostgreSqlContainer;
  let db: PostgresJsDatabase;
  let fieldRepository: DrizzleAnnotationFieldRepository;
  let templateRepository: DrizzleAnnotationTemplateRepository;

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
    `);
  }, 60000); // Increase timeout for container startup

  // Cleanup after all tests
  afterAll(async () => {
    // Stop container
    await container.stop();
  });

  // Clear data between tests
  beforeEach(async () => {
    await db.delete(annotationTemplateFields);
    await db.delete(annotationTemplates);
    await db.delete(annotationFields);
  });

  it("should save and retrieve a template with fields", async () => {
    // Import necessary dependencies
    // Create a test annotation field
    const fieldId = new UniqueEntityID();
    const curatorId = CuratorId.create("did:plc:testcurator").unwrap();
    const fieldName = AnnotationFieldName.create("Test Field").unwrap();
    const fieldDescription = AnnotationFieldDescription.create(
      "Test field description"
    ).unwrap();

    // Create a dyad field definition
    const fieldDefinition = AnnotationFieldDefinitionFactory.create({
      type: AnnotationType.create("dyad"),
      fieldDefProps: {
        sideA: "Side A",
        sideB: "Side B",
      },
    }).unwrap();

    // Create the annotation field
    const annotationField = AnnotationField.create(
      {
        curatorId,
        name: fieldName,
        description: fieldDescription,
        definition: fieldDefinition,
      },
      fieldId
    ).unwrap();

    // Save the field first
    await fieldRepository.save(annotationField);

    // Create a template field using the annotation field
    const templateField = AnnotationTemplateField.create({
      annotationField,
      required: true,
    }).unwrap();

    // Create template fields collection
    const templateFields = AnnotationTemplateFields.create([
      templateField,
    ]).unwrap();

    // Create the template
    const templateId = new UniqueEntityID();
    const templateName = AnnotationTemplateName.create(
      "Template With Fields"
    ).unwrap();
    const templateDescription = AnnotationTemplateDescription.create(
      "A template with fields"
    ).unwrap();

    const template = AnnotationTemplate.create(
      {
        curatorId,
        name: templateName,
        description: templateDescription,
        annotationTemplateFields: templateFields,
      },
      templateId
    ).unwrap();

    // Save the template
    await templateRepository.save(template);

    // Retrieve the template
    const retrievedTemplateId =
      AnnotationTemplateId.create(templateId).unwrap();
    const retrievedTemplate =
      await templateRepository.findById(retrievedTemplateId);

    // Verify template was retrieved correctly
    expect(retrievedTemplate).not.toBeNull();
    expect(retrievedTemplate?.templateId.getStringValue()).toBe(
      retrievedTemplateId.getStringValue()
    );
    expect(retrievedTemplate?.name.value).toBe("Template With Fields");
    expect(retrievedTemplate?.description.value).toBe("A template with fields");

    // Verify fields were retrieved correctly
    expect(retrievedTemplate?.annotationTemplateFields.isEmpty()).toBe(false);
    expect(retrievedTemplate?.getAnnotationFields().length).toBe(1);

    const retrievedField = retrievedTemplate?.getAnnotationFields()[0];
    expect(retrievedField?.fieldId.getStringValue()).toBe(fieldId.toString());
    expect(retrievedField?.name.value).toBe("Test Field");
  });
});
