import { DIDOrHandle, InvalidDIDOrHandleError } from '../../domain/DIDOrHandle';

describe('DIDOrHandle', () => {
  describe('create with DID', () => {
    it('should create a DIDOrHandle with valid DID', () => {
      const didString = 'did:plc:lehcqqkwzcwvjvw66uthu5oq';
      const result = DIDOrHandle.create(didString);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe(didString);
        expect(result.value.isDID).toBe(true);
        expect(result.value.isHandle).toBe(false);
      }
    });

    it('should create a DIDOrHandle with did:web format', () => {
      const didString = 'did:web:example.com';
      const result = DIDOrHandle.create(didString);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe(didString);
        expect(result.value.isDID).toBe(true);
        expect(result.value.isHandle).toBe(false);
      }
    });

    it('should reject invalid DID format', () => {
      const result = DIDOrHandle.create('did:invalid:format');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InvalidDIDOrHandleError);
        expect(result.error.message).toContain('Invalid DID');
      }
    });
  });

  describe('create with Handle', () => {
    it('should create a DIDOrHandle with valid handle', () => {
      const handleString = 'user.example.com';
      const result = DIDOrHandle.create(handleString);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe(handleString);
        expect(result.value.isDID).toBe(false);
        expect(result.value.isHandle).toBe(true);
      }
    });

    it('should create a DIDOrHandle with basic domain handle', () => {
      const handleString = 'example.com';
      const result = DIDOrHandle.create(handleString);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe(handleString);
        expect(result.value.isDID).toBe(false);
        expect(result.value.isHandle).toBe(true);
      }
    });

    it('should reject invalid handle format', () => {
      const result = DIDOrHandle.create('invalid-handle');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InvalidDIDOrHandleError);
        expect(result.error.message).toContain('Invalid handle');
      }
    });
  });

  describe('input validation', () => {
    it('should trim whitespace from input', () => {
      const didString = '  did:plc:lehcqqkwzcwvjvw66uthu5oq  ';
      const result = DIDOrHandle.create(didString);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe('did:plc:lehcqqkwzcwvjvw66uthu5oq');
      }
    });

    it('should reject empty string', () => {
      const result = DIDOrHandle.create('');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InvalidDIDOrHandleError);
        expect(result.error.message).toBe('Value cannot be empty');
      }
    });

    it('should reject whitespace-only string', () => {
      const result = DIDOrHandle.create('   ');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InvalidDIDOrHandleError);
        expect(result.error.message).toBe('Value cannot be empty');
      }
    });
  });

  describe('getDID', () => {
    it('should return DID object when created with DID', () => {
      const didString = 'did:plc:lehcqqkwzcwvjvw66uthu5oq';
      const result = DIDOrHandle.create(didString);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const did = result.value.getDID();
        expect(did).toBeDefined();
        expect(did?.value).toBe(didString);
      }
    });

    it('should return undefined when created with handle', () => {
      const handleString = 'example.com';
      const result = DIDOrHandle.create(handleString);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const did = result.value.getDID();
        expect(did).toBeUndefined();
      }
    });
  });

  describe('getHandle', () => {
    it('should return Handle object when created with handle', () => {
      const handleString = 'example.com';
      const result = DIDOrHandle.create(handleString);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const handle = result.value.getHandle();
        expect(handle).toBeDefined();
        expect(handle?.value).toBe(handleString);
      }
    });

    it('should return undefined when created with DID', () => {
      const didString = 'did:plc:lehcqqkwzcwvjvw66uthu5oq';
      const result = DIDOrHandle.create(didString);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const handle = result.value.getHandle();
        expect(handle).toBeUndefined();
      }
    });
  });

  describe('toString', () => {
    it('should return the original string value for DID', () => {
      const didString = 'did:plc:lehcqqkwzcwvjvw66uthu5oq';
      const result = DIDOrHandle.create(didString);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.toString()).toBe(didString);
      }
    });

    it('should return the original string value for handle', () => {
      const handleString = 'example.com';
      const result = DIDOrHandle.create(handleString);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.toString()).toBe(handleString);
      }
    });
  });

  describe('equals', () => {
    it('should return true for identical DID values', () => {
      const didString = 'did:plc:lehcqqkwzcwvjvw66uthu5oq';
      const didOrHandle1Result = DIDOrHandle.create(didString);
      const didOrHandle2Result = DIDOrHandle.create(didString);

      expect(didOrHandle1Result.isOk()).toBe(true);
      expect(didOrHandle2Result.isOk()).toBe(true);
      if (didOrHandle1Result.isOk() && didOrHandle2Result.isOk()) {
        expect(didOrHandle1Result.value.equals(didOrHandle2Result.value)).toBe(
          true,
        );
      }
    });

    it('should return true for identical handle values', () => {
      const handleString = 'example.com';
      const didOrHandle1Result = DIDOrHandle.create(handleString);
      const didOrHandle2Result = DIDOrHandle.create(handleString);

      expect(didOrHandle1Result.isOk()).toBe(true);
      expect(didOrHandle2Result.isOk()).toBe(true);
      if (didOrHandle1Result.isOk() && didOrHandle2Result.isOk()) {
        expect(didOrHandle1Result.value.equals(didOrHandle2Result.value)).toBe(
          true,
        );
      }
    });

    it('should return false for different values', () => {
      const didResult = DIDOrHandle.create('did:plc:lehcqqkwzcwvjvw66uthu5oq');
      const handleResult = DIDOrHandle.create('example.com');

      expect(didResult.isOk()).toBe(true);
      expect(handleResult.isOk()).toBe(true);
      if (didResult.isOk() && handleResult.isOk()) {
        expect(didResult.value.equals(handleResult.value)).toBe(false);
      }
    });

    it('should return false for different DIDs', () => {
      const did1Result = DIDOrHandle.create('did:plc:lehcqqkwzcwvjvw66uthu5oq');
      const did2Result = DIDOrHandle.create('did:plc:anotherdidvalue123456789');

      expect(did1Result.isOk()).toBe(true);
      expect(did2Result.isOk()).toBe(true);
      if (did1Result.isOk() && did2Result.isOk()) {
        expect(did1Result.value.equals(did2Result.value)).toBe(false);
      }
    });

    it('should return false for different handles', () => {
      const handle1Result = DIDOrHandle.create('example.com');
      const handle2Result = DIDOrHandle.create('different.com');

      expect(handle1Result.isOk()).toBe(true);
      expect(handle2Result.isOk()).toBe(true);
      if (handle1Result.isOk() && handle2Result.isOk()) {
        expect(handle1Result.value.equals(handle2Result.value)).toBe(false);
      }
    });
  });
});
