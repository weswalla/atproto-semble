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
} from "../schema/annotationTemplate.sql";
import { annotationFields } from "../schema/annotationField.sql";
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

  it("should fetch templates by curator ID", async () => {
    // Create two curators with different IDs
    const curatorId1 = CuratorId.create("did:plc:curator1").unwrap();
    const curatorId2 = CuratorId.create("did:plc:curator2").unwrap();

    // Create a field for templates
    const fieldId = new UniqueEntityID();
    const fieldName = AnnotationFieldName.create("Common Field").unwrap();
    const fieldDescription = AnnotationFieldDescription.create(
      "A common field for templates"
    ).unwrap();

    const fieldDefinition = AnnotationFieldDefinitionFactory.create({
      type: AnnotationType.create("dyad"),
      fieldDefProps: {
        sideA: "Left",
        sideB: "Right",
      },
    }).unwrap();

    // Create the annotation field with curator1
    const annotationField = AnnotationField.create(
      {
        curatorId: curatorId1,
        name: fieldName,
        description: fieldDescription,
        definition: fieldDefinition,
      },
      fieldId
    ).unwrap();

    // Save the field
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

    // Create templates for curator1
    const template1Id = new UniqueEntityID();
    const template1Name = AnnotationTemplateName.create(
      "Curator1 Template 1"
    ).unwrap();
    const template1Description = AnnotationTemplateDescription.create(
      "First template for curator1"
    ).unwrap();

    const template1 = AnnotationTemplate.create(
      {
        curatorId: curatorId1,
        name: template1Name,
        description: template1Description,
        annotationTemplateFields: templateFields,
      },
      template1Id
    ).unwrap();

    const template2Id = new UniqueEntityID();
    const template2Name = AnnotationTemplateName.create(
      "Curator1 Template 2"
    ).unwrap();
    const template2Description = AnnotationTemplateDescription.create(
      "Second template for curator1"
    ).unwrap();

    const template2 = AnnotationTemplate.create(
      {
        curatorId: curatorId1,
        name: template2Name,
        description: template2Description,
        annotationTemplateFields: templateFields,
      },
      template2Id
    ).unwrap();

    // Create a template for curator2
    const template3Id = new UniqueEntityID();
    const template3Name =
      AnnotationTemplateName.create("Curator2 Template").unwrap();
    const template3Description = AnnotationTemplateDescription.create(
      "Template for curator2"
    ).unwrap();

    const template3 = AnnotationTemplate.create(
      {
        curatorId: curatorId2,
        name: template3Name,
        description: template3Description,
        annotationTemplateFields: templateFields,
      },
      template3Id
    ).unwrap();

    // Save all templates
    await templateRepository.save(template1);
    await templateRepository.save(template2);
    await templateRepository.save(template3);

    // Fetch templates for curator1
    const curator1Templates =
      await templateRepository.findByCuratorId(curatorId1);

    // Verify we got the right templates
    expect(curator1Templates.length).toBe(2);
    expect(
      curator1Templates.some((t) => t.name.value === "Curator1 Template 1")
    ).toBe(true);
    expect(
      curator1Templates.some((t) => t.name.value === "Curator1 Template 2")
    ).toBe(true);
    expect(
      curator1Templates.every((t) => t.curatorId.value === "did:plc:curator1")
    ).toBe(true);

    // Fetch templates for curator2
    const curator2Templates =
      await templateRepository.findByCuratorId(curatorId2);

    // Verify we got the right template
    expect(curator2Templates.length).toBe(1);
    expect(curator2Templates[0]!.name.value).toBe("Curator2 Template");
    expect(curator2Templates[0]!.curatorId.value).toBe("did:plc:curator2");
  });
});
