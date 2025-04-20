import { CuratorId } from "./CuratorId";

describe("CuratorId Value Object", () => {
  describe("create", () => {
    it("should create a CuratorId for a valid did:plc", () => {
      const validDid = "did:plc:abcdef1234567890";
      const result = CuratorId.create(validDid);
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBeInstanceOf(CuratorId);
      expect(result.getValue().value).toBe(validDid);
    });

    it("should create a CuratorId for a valid did:web", () => {
      const validDid = "did:web:example.com";
      const result = CuratorId.create(validDid);
      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBeInstanceOf(CuratorId);
      expect(result.getValue().value).toBe(validDid);
    });

    it("should trim whitespace from input DID", () => {
      const validDid = "did:plc:abcdef1234567890";
      const result = CuratorId.create(`  ${validDid}  `);
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().value).toBe(validDid);
    });

    it("should fail for null input", () => {
      const result = CuratorId.create(null as any);
      expect(result.isFailure).toBe(true);
      expect(result.getErrorValue()).toContain("curatorId"); // From Guard
    });

    it("should fail for undefined input", () => {
      const result = CuratorId.create(undefined as any);
      expect(result.isFailure).toBe(true);
      expect(result.getErrorValue()).toContain("curatorId"); // From Guard
    });

    it("should fail for an empty string", () => {
      const result = CuratorId.create("");
      expect(result.isFailure).toBe(true);
      expect(result.getErrorValue()).toContain("CuratorId cannot be empty");
    });

    it("should fail for a string with only whitespace", () => {
      const result = CuratorId.create("   ");
      expect(result.isFailure).toBe(true);
      expect(result.getErrorValue()).toContain("CuratorId cannot be empty");
    });

    it("should fail for an invalid DID format (wrong prefix)", () => {
      const invalidDid = "did:other:12345";
      const result = CuratorId.create(invalidDid);
      expect(result.isFailure).toBe(true);
      expect(result.getErrorValue()).toContain("Invalid CuratorId format");
    });

    it("should fail for an invalid DID format (missing parts)", () => {
      const invalidDid = "did:plc:";
      const result = CuratorId.create(invalidDid);
      expect(result.isFailure).toBe(true);
      expect(result.getErrorValue()).toContain("Invalid CuratorId format");
    });

    it("should fail for a non-DID string", () => {
      const invalidDid = "not-a-did";
      const result = CuratorId.create(invalidDid);
      expect(result.isFailure).toBe(true);
      expect(result.getErrorValue()).toContain("Invalid CuratorId format");
    });
  });

  describe("value getter", () => {
    it("should return the correct DID string", () => {
      const validDid = "did:plc:xyz9876543210";
      const curatorId = CuratorId.create(validDid).getValue();
      expect(curatorId.value).toBe(validDid);
    });
  });

  describe("equals method", () => {
    it("should return true for CuratorIds with the same value", () => {
      const did = "did:web:test.example.org";
      const id1 = CuratorId.create(did).getValue();
      const id2 = CuratorId.create(did).getValue();
      expect(id1.equals(id2)).toBe(true);
    });

    it("should return false for CuratorIds with different values", () => {
      const id1 = CuratorId.create("did:plc:111").getValue();
      const id2 = CuratorId.create("did:plc:222").getValue();
      expect(id1.equals(id2)).toBe(false);
    });

    it("should return false when comparing with null or undefined", () => {
      const id1 = CuratorId.create("did:plc:111").getValue();
      expect(id1.equals(null as any)).toBe(false);
      expect(id1.equals(undefined as any)).toBe(false);
    });
  });

  describe("toString method", () => {
    it("should return the DID string", () => {
      const validDid = "did:web:another-example.com";
      const curatorId = CuratorId.create(validDid).getValue();
      expect(curatorId.toString()).toBe(validDid);
    });
  });
});
