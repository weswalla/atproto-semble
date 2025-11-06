import { URL, InvalidURLError } from '../../../domain/value-objects/URL';

describe('URL Value Object', () => {
  describe('create', () => {
    describe('valid URLs', () => {
      it('should create URL with valid http URL', () => {
        const result = URL.create('http://example.com');

        expect(result.isOk()).toBe(true);
        expect(result.unwrap().value).toBe('http://example.com/');
      });

      it('should create URL with valid https URL', () => {
        const result = URL.create('https://example.com');

        expect(result.isOk()).toBe(true);
        expect(result.unwrap().value).toBe('https://example.com/');
      });

      it('should create URL with subdomain', () => {
        const result = URL.create('https://www.example.com');

        expect(result.isOk()).toBe(true);
        expect(result.unwrap().value).toBe('https://www.example.com/');
      });

      it('should create URL with port', () => {
        const result = URL.create('https://example.com:8080');

        expect(result.isOk()).toBe(true);
        expect(result.unwrap().value).toBe('https://example.com:8080/');
      });
    });

    describe('trailing slash normalization', () => {
      describe('should add trailing slash to bare root domains', () => {
        it('should add trailing slash to http://example.com', () => {
          const result = URL.create('http://example.com');

          expect(result.isOk()).toBe(true);
          expect(result.unwrap().value).toBe('http://example.com/');
        });

        it('should add trailing slash to https://example.com', () => {
          const result = URL.create('https://example.com');

          expect(result.isOk()).toBe(true);
          expect(result.unwrap().value).toBe('https://example.com/');
        });

        it('should add trailing slash to https://www.example.com', () => {
          const result = URL.create('https://www.example.com');

          expect(result.isOk()).toBe(true);
          expect(result.unwrap().value).toBe('https://www.example.com/');
        });

        it('should add trailing slash to https://example.com:8080', () => {
          const result = URL.create('https://example.com:8080');

          expect(result.isOk()).toBe(true);
          expect(result.unwrap().value).toBe('https://example.com:8080/');
        });

        it('should add trailing slash to https://sub.domain.example.com', () => {
          const result = URL.create('https://sub.domain.example.com');

          expect(result.isOk()).toBe(true);
          expect(result.unwrap().value).toBe('https://sub.domain.example.com/');
        });
      });

      describe('should NOT add trailing slash when already present', () => {
        it('should not add trailing slash to https://example.com/', () => {
          const result = URL.create('https://example.com/');

          expect(result.isOk()).toBe(true);
          expect(result.unwrap().value).toBe('https://example.com/');
        });

        it('should not add trailing slash to https://www.example.com/', () => {
          const result = URL.create('https://www.example.com/');

          expect(result.isOk()).toBe(true);
          expect(result.unwrap().value).toBe('https://www.example.com/');
        });

        it('should not add trailing slash to https://example.com:8080/', () => {
          const result = URL.create('https://example.com:8080/');

          expect(result.isOk()).toBe(true);
          expect(result.unwrap().value).toBe('https://example.com:8080/');
        });
      });

      describe('should NOT add trailing slash to URLs with paths', () => {
        it('should not add trailing slash to https://example.com/path', () => {
          const result = URL.create('https://example.com/path');

          expect(result.isOk()).toBe(true);
          expect(result.unwrap().value).toBe('https://example.com/path');
        });

        it('should not add trailing slash to https://example.com/path/subpath', () => {
          const result = URL.create('https://example.com/path/subpath');

          expect(result.isOk()).toBe(true);
          expect(result.unwrap().value).toBe(
            'https://example.com/path/subpath',
          );
        });

        it('should not add trailing slash to https://example.com/path/', () => {
          const result = URL.create('https://example.com/path/');

          expect(result.isOk()).toBe(true);
          expect(result.unwrap().value).toBe('https://example.com/path/');
        });

        it('should not add trailing slash to https://example.com/path.html', () => {
          const result = URL.create('https://example.com/path.html');

          expect(result.isOk()).toBe(true);
          expect(result.unwrap().value).toBe('https://example.com/path.html');
        });

        it('should not add trailing slash to https://example.com/api/v1/users', () => {
          const result = URL.create('https://example.com/api/v1/users');

          expect(result.isOk()).toBe(true);
          expect(result.unwrap().value).toBe(
            'https://example.com/api/v1/users',
          );
        });
      });

      describe('should NOT add trailing slash to URLs with query parameters', () => {
        it('should not add trailing slash to https://example.com?param=value', () => {
          const result = URL.create('https://example.com?param=value');

          expect(result.isOk()).toBe(true);
          expect(result.unwrap().value).toBe('https://example.com?param=value');
        });

        it('should not add trailing slash to https://example.com?param1=value1&param2=value2', () => {
          const result = URL.create(
            'https://example.com?param1=value1&param2=value2',
          );

          expect(result.isOk()).toBe(true);
          expect(result.unwrap().value).toBe(
            'https://example.com?param1=value1&param2=value2',
          );
        });

        it('should not add trailing slash to https://example.com/?param=value', () => {
          const result = URL.create('https://example.com/?param=value');

          expect(result.isOk()).toBe(true);
          expect(result.unwrap().value).toBe(
            'https://example.com/?param=value',
          );
        });

        it('should not add trailing slash to https://example.com/path?param=value', () => {
          const result = URL.create('https://example.com/path?param=value');

          expect(result.isOk()).toBe(true);
          expect(result.unwrap().value).toBe(
            'https://example.com/path?param=value',
          );
        });
      });

      describe('should NOT add trailing slash to URLs with fragments', () => {
        it('should not add trailing slash to https://example.com#section', () => {
          const result = URL.create('https://example.com#section');

          expect(result.isOk()).toBe(true);
          expect(result.unwrap().value).toBe('https://example.com#section');
        });

        it('should not add trailing slash to https://example.com/#section', () => {
          const result = URL.create('https://example.com/#section');

          expect(result.isOk()).toBe(true);
          expect(result.unwrap().value).toBe('https://example.com/#section');
        });

        it('should not add trailing slash to https://example.com/path#section', () => {
          const result = URL.create('https://example.com/path#section');

          expect(result.isOk()).toBe(true);
          expect(result.unwrap().value).toBe(
            'https://example.com/path#section',
          );
        });

        it('should not add trailing slash to https://example.com?param=value#section', () => {
          const result = URL.create('https://example.com?param=value#section');

          expect(result.isOk()).toBe(true);
          expect(result.unwrap().value).toBe(
            'https://example.com?param=value#section',
          );
        });
      });

      describe('should NOT add trailing slash to URLs with query parameters AND fragments', () => {
        it('should not add trailing slash to https://example.com?param=value#section', () => {
          const result = URL.create('https://example.com?param=value#section');

          expect(result.isOk()).toBe(true);
          expect(result.unwrap().value).toBe(
            'https://example.com?param=value#section',
          );
        });

        it('should not add trailing slash to https://example.com/path?param=value#section', () => {
          const result = URL.create(
            'https://example.com/path?param=value#section',
          );

          expect(result.isOk()).toBe(true);
          expect(result.unwrap().value).toBe(
            'https://example.com/path?param=value#section',
          );
        });
      });
    });

    describe('edge cases', () => {
      it('should handle URLs with IP addresses', () => {
        const result = URL.create('http://192.168.1.1');

        expect(result.isOk()).toBe(true);
        expect(result.unwrap().value).toBe('http://192.168.1.1/');
      });

      it('should handle URLs with IP addresses and ports', () => {
        const result = URL.create('http://192.168.1.1:8080');

        expect(result.isOk()).toBe(true);
        expect(result.unwrap().value).toBe('http://192.168.1.1:8080/');
      });

      it('should handle localhost', () => {
        const result = URL.create('http://localhost');

        expect(result.isOk()).toBe(true);
        expect(result.unwrap().value).toBe('http://localhost/');
      });

      it('should handle localhost with port', () => {
        const result = URL.create('http://localhost:3000');

        expect(result.isOk()).toBe(true);
        expect(result.unwrap().value).toBe('http://localhost:3000/');
      });

      it('should trim whitespace before processing', () => {
        const result = URL.create('  https://example.com  ');

        expect(result.isOk()).toBe(true);
        expect(result.unwrap().value).toBe('https://example.com/');
      });

      it('should handle URLs with authentication', () => {
        const result = URL.create('https://user:pass@example.com');

        expect(result.isOk()).toBe(true);
        expect(result.unwrap().value).toBe('https://user:pass@example.com/');
      });
      it('should handle URLs with multiple slashes', () => {
        const result = URL.create('https://example.com//');

        expect(result.isOk()).toBe(true);
        expect(result.unwrap().value).toBe('https://example.com//');
      });
    });

    describe('invalid URLs', () => {
      it('should fail for empty string', () => {
        const result = URL.create('');

        if (!result.isErr()) {
          throw new Error('Expected result to be an error');
        }
        expect(result.isErr()).toBe(true);
        expect(result.error).toBeInstanceOf(InvalidURLError);
        expect(result.error.message).toBe('URL cannot be empty');
      });

      it('should fail for whitespace only', () => {
        const result = URL.create('   ');

        if (!result.isErr()) {
          throw new Error('Expected result to be an error');
        }
        expect(result.isErr()).toBe(true);
        expect(result.error).toBeInstanceOf(InvalidURLError);
        expect(result.error.message).toBe('URL cannot be empty');
      });

      it('should fail for invalid URL format', () => {
        const result = URL.create('not-a-url');

        if (!result.isErr()) {
          throw new Error('Expected result to be an error');
        }
        expect(result.isErr()).toBe(true);
        expect(result.error).toBeInstanceOf(InvalidURLError);
        expect(result.error.message).toBe('Invalid URL format');
      });

      it('should fail for URL without protocol', () => {
        const result = URL.create('example.com');

        if (!result.isErr()) {
          throw new Error('Expected result to be an error');
        }
        expect(result.isErr()).toBe(true);
        expect(result.error).toBeInstanceOf(InvalidURLError);
        expect(result.error.message).toBe('Invalid URL format');
      });

      it('should fail for malformed URL', () => {
        const result = URL.create('https://');

        if (!result.isErr()) {
          throw new Error('Expected result to be an error');
        }
        expect(result.isErr()).toBe(true);
        expect(result.error).toBeInstanceOf(InvalidURLError);
        expect(result.error.message).toBe('Invalid URL format');
      });
    });
  });

  describe('toString', () => {
    it('should return the URL value as string', () => {
      const url = URL.create('https://example.com/path').unwrap();

      expect(url.toString()).toBe('https://example.com/path');
    });

    it('should return normalized URL with trailing slash for bare domains', () => {
      const url = URL.create('https://example.com').unwrap();

      expect(url.toString()).toBe('https://example.com/');
    });
  });

  describe('value getter', () => {
    it('should return the URL value', () => {
      const url = URL.create('https://example.com/path').unwrap();

      expect(url.value).toBe('https://example.com/path');
    });

    it('should return normalized URL with trailing slash for bare domains', () => {
      const url = URL.create('https://example.com').unwrap();

      expect(url.value).toBe('https://example.com/');
    });
  });
});
