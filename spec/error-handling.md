## ⚠️ Expressive Error Handling

Use expressive, rich domain and application error objects—no blind exceptions.

**Example:**

```ts
// core/errors/DomainError.ts
export class DomainError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
  }
}

// annotation/application/errors/InvalidAnnotationError.ts
export class InvalidAnnotationError extends DomainError {
  constructor(reason: string) {
    super(`Invalid annotation: ${reason}`, "ANNOTATION_INVALID");
  }
}
```

Use `Result<T, E>` or `Either<L, R>` to return error/success from use-cases:

```ts
const result = await createAnnotation.execute(input);
if (result.isErr()) {
  return res.status(400).json({ error: result.error.message });
}
```
