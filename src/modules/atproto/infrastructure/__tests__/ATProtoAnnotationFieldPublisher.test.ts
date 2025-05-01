import { ATProtoAnnotationFieldPublisher } from "../ATProtoAnnotationFieldPublisher";
import { AnnotationField } from "src/modules/annotations/domain/AnnotationField";
import { AnnotationFieldName } from "src/modules/annotations/domain/value-objects/AnnotationFieldName";
import { AnnotationFieldDescription } from "src/modules/annotations/domain/value-objects/AnnotationFieldDescription";
import { CuratorId } from "src/modules/annotations/domain/value-objects/CuratorId";
import { PublishedRecordId } from "src/modules/annotations/domain/value-objects/PublishedRecordId";
import { BskyAgent } from "@atproto/api";
import { UniqueEntityID } from "src/shared/domain/UniqueEntityID";
import { AnnotationFieldDefinition } from "src/modules/annotations/domain/value-objects/AnnotationFieldDefinition";
import { AnnotationType } from "src/modules/annotations/domain/value-objects/AnnotationType";

// Mock BskyAgent
jest.mock("@atproto/api", () => {
  return {
    BskyAgent: jest.fn().mockImplementation(() => {
      return {
        com: {
          atproto: {
            repo: {
              createRecord: jest.fn().mockResolvedValue({
                data: {
                  uri: "at://did:plc:abcdef/app.annos.annotationField/test123",
                  cid: "bafyreicypkbz3nrqqnfg6kzxgdiuh4xnkjvgwznbsxgve7vv2cfmvbrfgi"
                }
              }),
              putRecord: jest.fn().mockResolvedValue({
                data: {
                  uri: "at://did:plc:abcdef/app.annos.annotationField/test123",
                  cid: "bafyreicypkbz3nrqqnfg6kzxgdiuh4xnkjvgwznbsxgve7vv2cfmvbrfgi"
                }
              }),
              deleteRecord: jest.fn().mockResolvedValue({})
            }
          }
        }
      };
    })
  };
});

describe("ATProtoAnnotationFieldPublisher", () => {
  let publisher: ATProtoAnnotationFieldPublisher;
  let mockAgent: jest.Mocked<BskyAgent>;
  let testField: AnnotationField;
  
  beforeEach(() => {
    mockAgent = new BskyAgent() as jest.Mocked<BskyAgent>;
    publisher = new ATProtoAnnotationFieldPublisher(mockAgent);
    
    // Create a test field with a dyad definition
    const curatorId = CuratorId.create("did:plc:abcdef").unwrap();
    const name = AnnotationFieldName.create("Test Field").unwrap();
    const description = AnnotationFieldDescription.create("A test field").unwrap();
    
    // Create a dyad field definition
    const dyadType = AnnotationType.create("dyad").unwrap();
    const dyadDef = AnnotationFieldDefinition.createDyad(
      dyadType,
      "Agree",
      "Disagree"
    ).unwrap();
    
    const fieldResult = AnnotationField.create({
      curatorId,
      name,
      description,
      definition: dyadDef,
      createdAt: new Date("2023-01-01T00:00:00Z")
    }, new UniqueEntityID("test-id"));
    
    testField = fieldResult.unwrap();
  });
  
  describe("publish", () => {
    it("should create a new record when field is not published", async () => {
      const result = await publisher.publish(testField);
      
      expect(result.isOk()).toBe(true);
      expect(mockAgent.com.atproto.repo.createRecord).toHaveBeenCalledWith({
        repo: "did:plc:abcdef",
        collection: "app.annos.annotationField",
        record: {
          $type: "app.annos.annotationField",
          name: "Test Field",
          description: "A test field",
          createdAt: "2023-01-01T00:00:00.000Z",
          definition: {
            $type: "app.annos.annotationField#dyadFieldDef",
            sideA: "Agree",
            sideB: "Disagree"
          }
        }
      });
      
      if (result.isOk()) {
        expect(result.value.getValue()).toBe("at://did:plc:abcdef/app.annos.annotationField/test123");
      }
    });
    
    it("should update an existing record when field is already published", async () => {
      // Mark the field as published
      const publishedId = PublishedRecordId.create(
        "at://did:plc:abcdef/app.annos.annotationField/test123"
      );
      testField.markAsPublished(publishedId);
      
      const result = await publisher.publish(testField);
      
      expect(result.isOk()).toBe(true);
      expect(mockAgent.com.atproto.repo.putRecord).toHaveBeenCalledWith({
        repo: "did:plc:abcdef",
        collection: "app.annos.annotationField",
        rkey: "test123",
        record: {
          $type: "app.annos.annotationField",
          name: "Test Field",
          description: "A test field",
          createdAt: "2023-01-01T00:00:00.000Z",
          definition: {
            $type: "app.annos.annotationField#dyadFieldDef",
            sideA: "Agree",
            sideB: "Disagree"
          }
        }
      });
    });
  });
  
  describe("unpublish", () => {
    it("should delete a record", async () => {
      const recordId = PublishedRecordId.create(
        "at://did:plc:abcdef/app.annos.annotationField/test123"
      );
      
      const result = await publisher.unpublish(recordId);
      
      expect(result.isOk()).toBe(true);
      expect(mockAgent.com.atproto.repo.deleteRecord).toHaveBeenCalledWith({
        repo: "did:plc:abcdef",
        collection: "app.annos.annotationField",
        rkey: "test123"
      });
    });
  });
});
