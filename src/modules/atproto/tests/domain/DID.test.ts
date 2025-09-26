import { DID, InvalidDIDError } from '../../domain/DID';

describe('DID', () => {
  describe('create', () => {
    it('should create a valid DID with did:plc format', () => {
      const didString = 'did:plc:lehcqqkwzcwvjvw66uthu5oq';
      const result = DID.create(didString);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe(didString);
      }
    });

    it('should create a valid DID with did:web format', () => {
      const didString = 'did:web:example.com';
      const result = DID.create(didString);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe(didString);
      }
    });

    it('should create a valid DID with did:web format with path', () => {
      const didString = 'did:web:example.com%2Fpath';
      const result = DID.create(didString);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe(didString);
      }
    });

    it('should trim whitespace from input', () => {
      const didString = '  did:plc:lehcqqkwzcwvjvw66uthu5oq  ';
      const result = DID.create(didString);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe('did:plc:lehcqqkwzcwvjvw66uthu5oq');
      }
    });

    it('should reject empty string', () => {
      const result = DID.create('');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InvalidDIDError);
        expect(result.error.message).toBe('DID cannot be empty');
      }
    });

    it('should reject whitespace-only string', () => {
      const result = DID.create('   ');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InvalidDIDError);
        expect(result.error.message).toBe('DID cannot be empty');
      }
    });

    it('should reject invalid DID format without did: prefix', () => {
      const result = DID.create('plc:lehcqqkwzcwvjvw66uthu5oq');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InvalidDIDError);
        expect(result.error.message).toContain('Invalid DID format');
      }
    });

    it('should reject unsupported DID method', () => {
      const result = DID.create(
        'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InvalidDIDError);
        expect(result.error.message).toContain('Invalid DID format');
      }
    });

    it('should reject malformed did:plc', () => {
      const result = DID.create('did:plc:');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InvalidDIDError);
        expect(result.error.message).toContain('Invalid DID format');
      }
    });

    it('should reject malformed did:web', () => {
      const result = DID.create('did:web:');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InvalidDIDError);
        expect(result.error.message).toContain('Invalid DID format');
      }
    });
  });

  describe('value getter', () => {
    it('should return the DID string value', () => {
      const didString = 'did:plc:lehcqqkwzcwvjvw66uthu5oq';
      const result = DID.create(didString);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe(didString);
      }
    });
  });

  describe('toString', () => {
    it('should return the DID string value', () => {
      const didString = 'did:plc:lehcqqkwzcwvjvw66uthu5oq';
      const result = DID.create(didString);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.toString()).toBe(didString);
      }
    });
  });

  describe('equals', () => {
    it('should return true for identical DIDs', () => {
      const didString = 'did:plc:lehcqqkwzcwvjvw66uthu5oq';
      const did1Result = DID.create(didString);
      const did2Result = DID.create(didString);

      expect(did1Result.isOk()).toBe(true);
      expect(did2Result.isOk()).toBe(true);
      if (did1Result.isOk() && did2Result.isOk()) {
        expect(did1Result.value.equals(did2Result.value)).toBe(true);
      }
    });

    it('should return false for different DIDs', () => {
      const did1Result = DID.create('did:plc:lehcqqkwzcwvjvw66uthu5oq');
      const did2Result = DID.create('did:plc:anotherdidvalue123456789');

      expect(did1Result.isOk()).toBe(true);
      expect(did2Result.isOk()).toBe(true);
      if (did1Result.isOk() && did2Result.isOk()) {
        expect(did1Result.value.equals(did2Result.value)).toBe(false);
      }
    });
  });
});
