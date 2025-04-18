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
