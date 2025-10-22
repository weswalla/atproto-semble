import { Handle, InvalidHandleError } from '../../domain/Handle';

describe('Handle', () => {
  describe('create', () => {
    it('should create a valid handle with basic domain', () => {
      const handleString = 'example.com';
      const result = Handle.create(handleString);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe(handleString);
      }
    });

    it('should create a valid handle with subdomain', () => {
      const handleString = 'user.example.com';
      const result = Handle.create(handleString);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe(handleString);
      }
    });

    it('should create a valid handle with multiple subdomains', () => {
      const handleString = 'subsub.subdomain.example.com';
      const result = Handle.create(handleString);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe(handleString);
      }
    });

    it('should create a valid handle with hyphens', () => {
      const handleString = 'my-user.example-site.com';
      const result = Handle.create(handleString);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe(handleString);
      }
    });

    it('should create a valid handle with numbers', () => {
      const handleString = 'user123.example2.com';
      const result = Handle.create(handleString);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe(handleString);
      }
    });

    it('should trim whitespace from input', () => {
      const handleString = '  example.com  ';
      const result = Handle.create(handleString);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe('example.com');
      }
    });

    it('should reject empty string', () => {
      const result = Handle.create('');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InvalidHandleError);
        expect(result.error.message).toBe('Handle cannot be empty');
      }
    });

    it('should reject whitespace-only string', () => {
      const result = Handle.create('   ');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InvalidHandleError);
        expect(result.error.message).toBe('Handle cannot be empty');
      }
    });

    it('should reject handle without dot', () => {
      const result = Handle.create('example');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InvalidHandleError);
        expect(result.error.message).toBe('Handle must be a valid domain');
      }
    });

    it('should reject handle starting with dot', () => {
      const result = Handle.create('.example.com');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InvalidHandleError);
        expect(result.error.message).toBe('Handle must be a valid domain');
      }
    });

    it('should reject handle ending with dot', () => {
      const result = Handle.create('example.com.');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InvalidHandleError);
        expect(result.error.message).toBe('Handle must be a valid domain');
      }
    });

    it('should reject handle starting with hyphen', () => {
      const result = Handle.create('-example.com');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InvalidHandleError);
        expect(result.error.message).toBe('Handle must be a valid domain');
      }
    });

    it('should reject handle ending with hyphen', () => {
      const result = Handle.create('example.com-');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InvalidHandleError);
        expect(result.error.message).toBe('Handle must be a valid domain');
      }
    });

    it('should reject domain part starting with hyphen', () => {
      const result = Handle.create('-user.example.com');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InvalidHandleError);
        expect(result.error.message).toBe('Handle must be a valid domain');
      }
    });

    it('should reject domain part ending with hyphen', () => {
      const result = Handle.create('user-.example.com');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InvalidHandleError);
        expect(result.error.message).toBe('Handle must be a valid domain');
      }
    });

    it('should reject handle with invalid characters', () => {
      const result = Handle.create('user@example.com');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InvalidHandleError);
        expect(result.error.message).toBe('Handle must be a valid domain');
      }
    });

    it('should reject handle with empty domain part', () => {
      const result = Handle.create('user..com');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InvalidHandleError);
        expect(result.error.message).toBe('Handle must be a valid domain');
      }
    });

    it('should reject handle with domain part too long', () => {
      const longPart = 'a'.repeat(64); // 64 characters, exceeds 63 limit
      const result = Handle.create(`${longPart}.com`);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(InvalidHandleError);
        expect(result.error.message).toBe('Handle must be a valid domain');
      }
    });
  });

  describe('value getter', () => {
    it('should return the handle string value', () => {
      const handleString = 'example.com';
      const result = Handle.create(handleString);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe(handleString);
      }
    });
  });

  describe('toString', () => {
    it('should return the handle string value', () => {
      const handleString = 'example.com';
      const result = Handle.create(handleString);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.toString()).toBe(handleString);
      }
    });
  });

  describe('equals', () => {
    it('should return true for identical handles', () => {
      const handleString = 'example.com';
      const handle1Result = Handle.create(handleString);
      const handle2Result = Handle.create(handleString);

      expect(handle1Result.isOk()).toBe(true);
      expect(handle2Result.isOk()).toBe(true);
      if (handle1Result.isOk() && handle2Result.isOk()) {
        expect(handle1Result.value.equals(handle2Result.value)).toBe(true);
      }
    });

    it('should return false for different handles', () => {
      const handle1Result = Handle.create('example.com');
      const handle2Result = Handle.create('different.com');

      expect(handle1Result.isOk()).toBe(true);
      expect(handle2Result.isOk()).toBe(true);
      if (handle1Result.isOk() && handle2Result.isOk()) {
        expect(handle1Result.value.equals(handle2Result.value)).toBe(false);
      }
    });
  });
});
