# Testing Strategy

This document outlines the testing strategy for the Annos service, following Domain-Driven Design (DDD) and Layered Architecture principles.

## Goals

*   Ensure correctness and reliability of the application.
*   Provide fast feedback during development.
*   Facilitate refactoring and maintenance.
*   Verify integration between different parts of the system.

## Testing Levels

We will employ a multi-layered testing approach, focusing tests at the appropriate level of the architecture:

1.  **Unit Tests:**
    *   **Focus:** Individual classes, methods, or functions in isolation. Primarily target Domain Layer objects (Aggregates, Value Objects, Domain Services) and utility functions.
    *   **Scope:** Test business logic, validation rules, state transitions, and calculations within a single unit.
    *   **Dependencies:** Mocked or stubbed. No external dependencies (database, network, file system).
    *   **Tools:** Jest.
    *   **Location:** `tests/<bounded-context>/domain/**` (e.g., `tests/annotations/domain/value-objects/AnnotationValue.test.ts`)

2.  **Integration Tests:**
    *   **Focus:** Interactions between components within a layer or across adjacent layers. Primarily target Application Layer Use Cases and Infrastructure Layer components (Repositories, Mappers).
    *   **Scope:**
        *   *Application Layer:* Verify use cases correctly orchestrate domain objects and interact with repositories (using mocked repositories).
        *   *Infrastructure Layer:* Verify repositories correctly interact with the database (using a test database or in-memory alternatives if feasible), or mappers correctly transform data.
    *   **Dependencies:** May involve mocked components (e.g., mocking a repository for a use case test) or real infrastructure components connected to a test environment (e.g., testing a repository against a test database).
    *   **Tools:** Jest, Test Database (e.g., Dockerized Postgres), potentially Supertest for API endpoint integration.
    *   **Location:** `tests/<bounded-context>/application/**`, `tests/<bounded-context>/infrastructure/**` (e.g., `tests/annotations/application/use-cases/CreateAnnotationUseCase.test.ts`, `tests/annotations/infrastructure/persistence/AnnotationRepository.integration.test.ts`)

3.  **End-to-End (E2E) Tests:**
    *   **Focus:** Simulating real user scenarios through the entire system, typically via the API or UI.
    *   **Scope:** Verify complete workflows, from request initiation (e.g., HTTP request) to response validation, including interactions with the database and potentially external services.
    *   **Dependencies:** Requires a fully running instance of the application and its dependencies (database, etc.) in a dedicated test environment.
    *   **Tools:** Supertest (for API testing), potentially Playwright or Cypress if a UI is involved.
    *   **Location:** `tests/e2e/**`

## Guiding Principles

*   **Test Pyramid:** Emphasize a larger number of fast unit tests, a moderate number of integration tests, and fewer, more comprehensive E2E tests.
*   **Isolate Layers:** Test domain logic independently of application and infrastructure concerns. Test application logic with mocked infrastructure. Test infrastructure against real (test) dependencies.
*   **Mocking:** Use mocking judiciously, primarily at the boundaries between layers (e.g., mocking repositories in use case tests). Avoid excessive mocking within a single unit.
*   **Test Data:** Use realistic and clearly defined test data. Consider factories or builders for creating complex objects.
*   **CI/CD:** Integrate tests into the Continuous Integration pipeline to ensure code quality and prevent regressions.

## Test Runner & Environment

*   **Runner:** Jest
*   **Configuration:** `jest.config.js` (to be created if needed for more complex setup).
*   **Execution:** `npm test`

## Current Focus

Initially, we will focus on:

*   Unit tests for critical Domain Layer Value Objects and Aggregates.
*   Integration tests for Application Layer Use Cases, mocking the repository layer.

## Testing Repository Implementations

Repository implementations like `DrizzleAnnotationFieldRepository` and `DrizzleAnnotationTemplateRepository` require special consideration as they interact with databases:

### Approach 1: In-memory Database (Recommended for Unit Tests)

For fast, isolated tests of repository implementations:

1. **Use SQLite in-memory database:**
   ```typescript
   import { drizzle } from 'drizzle-orm/better-sqlite3';
   import Database from 'better-sqlite3';
   import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

   // Setup in-memory SQLite for tests
   const sqlite = new Database(':memory:');
   const db = drizzle(sqlite);
   
   // Apply migrations or create schema
   migrate(db, { migrationsFolder: './drizzle' });
   
   // Create repository with in-memory database
   const repo = new DrizzleAnnotationFieldRepository(db);
   ```

2. **Benefits:**
   * Fast execution - no network or disk I/O
   * Isolated - each test gets a fresh database
   * No external dependencies or setup required

3. **Limitations:**
   * SQLite dialect differences from PostgreSQL
   * Some PostgreSQL-specific features won't be testable

### Approach 2: Test Containers (For Integration Tests)

For more realistic tests that verify PostgreSQL compatibility:

1. **Use testcontainers-node to spin up a PostgreSQL container:**
   ```typescript
   import { PostgreSqlContainer } from 'testcontainers';
   import postgres from 'postgres';
   import { drizzle } from 'drizzle-orm/postgres-js';

   // In beforeAll hook
   const container = await new PostgreSqlContainer().start();
   const connectionString = container.getConnectionUri();
   const sql = postgres(connectionString);
   const db = drizzle(sql);
   
   // In afterAll hook
   await container.stop();
   ```

2. **Benefits:**
   * Tests against actual PostgreSQL
   * Verifies dialect-specific features
   * Isolated from development/production databases

3. **Drawbacks:**
   * Slower test execution
   * Requires Docker

### Approach 3: Mock Database Client (For Pure Unit Tests)

For pure unit tests focusing on repository logic:

1. **Mock the database client:**
   ```typescript
   const mockDb = {
     select: jest.fn().mockReturnThis(),
     from: jest.fn().mockReturnThis(),
     where: jest.fn().mockReturnThis(),
     limit: jest.fn().mockReturnValue([{ /* mock data */ }]),
     insert: jest.fn().mockReturnThis(),
     values: jest.fn().mockReturnThis(),
     onConflictDoUpdate: jest.fn().mockResolvedValue(undefined),
     delete: jest.fn().mockReturnThis(),
   };
   
   const repo = new DrizzleAnnotationFieldRepository(mockDb as any);
   ```

2. **Benefits:**
   * Fastest execution
   * No database dependencies
   * Tests repository logic in isolation

3. **Drawbacks:**
   * Doesn't test actual SQL generation
   * Requires complex mocking setup
   * Lower confidence in database interaction

### Recommended Approach

Use a combination:
1. **Unit tests with SQLite in-memory** for fast feedback during development
2. **Integration tests with test containers** for critical paths and PostgreSQL-specific features
3. **End-to-end tests** that verify the entire stack works together

This provides a balance of speed, isolation, and confidence in your repository implementations.
