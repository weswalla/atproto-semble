import { PostgreSqlContainer } from "@testcontainers/postgresql";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { DrizzleAnnotationTemplateRepository } from "../DrizzleAnnotationTemplateRepository";
import { DrizzleAnnotationFieldRepository } from "../DrizzleAnnotationFieldRepository";
import { AnnotationTemplateId, CuratorId } from "../../../domain/value-objects";
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

describe("DrizzleAnnotationTemplateRepository", () => {
  let container: PostgreSqlContainer;
  let db: ReturnType<typeof drizzle>;
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

    // Create schema for both tables
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

      CREATE TABLE IF NOT EXISTS annotation_templates (
        id TEXT PRIMARY KEY,
        curator_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        published_record_id TEXT
      );

      CREATE TABLE IF NOT EXISTS annotation_template_fields (
        template_id TEXT NOT NULL REFERENCES annotation_templates(id) ON DELETE CASCADE,
        field_id TEXT NOT NULL REFERENCES annotation_fields(id),
        required BOOLEAN NOT NULL DEFAULT false,
        PRIMARY KEY (template_id, field_id)
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

  // Basic test to verify repository can save and retrieve a template
  it("should save and retrieve a template without fields", async () => {
    // Create a test template
    const id = new UniqueEntityID("template-test-123");
    const curatorId = CuratorId.create("did:plc:testcurator").unwrap();
    const name = AnnotationTemplateName.create("Test Template").unwrap();
    const description =
      AnnotationTemplateDescription.create("Test description").unwrap();
    const fields = AnnotationTemplateFields.create([]).unwrap();

    const template = AnnotationTemplate.create(
      {
        curatorId,
        name,
        description,
        annotationTemplateFields: fields,
      },
      id
    ).unwrap();

    // Save the template
    await templateRepository.save(template);

    // Retrieve the template
    const templateId = AnnotationTemplateId.create(id).unwrap();
    const retrievedTemplate = await templateRepository.findById(templateId);

    // Verify template was retrieved correctly
    expect(retrievedTemplate).not.toBeNull();
    expect(retrievedTemplate?.templateId.getStringValue()).toBe(
      templateId.getStringValue()
    );
    expect(retrievedTemplate?.name.value).toBe("Test Template");
    expect(retrievedTemplate?.description.value).toBe("Test description");
    expect(retrievedTemplate?.annotationTemplateFields.isEmpty()).toBe(true);
  });
});
