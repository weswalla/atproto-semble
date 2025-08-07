# Directory Structure

This document outlines the project's directory structure, designed to support a layered architecture based on Domain-Driven Design (DDD) principles.

## Top-Level Structure

```
.
├── docs/                 # Project documentation (like this file, domain model)
├── lexicons/             # Lexicon definition files (.json)
├── src/                  # Source code
│   ├── annotations/      # Bounded Context: Annotations
│   ├── atproto/          # Bounded Context: AT Protocol specifics
│   ├── lexicon/          # Generated lexicon types and utilities
│   └── main.ts           # Application entry point (e.g., server setup)
├── test/                 # Automated tests
├── .gitignore
├── package.json
├── tsconfig.json
└── ...                   # Other configuration files
```

## Bounded Context Structure (`src/<context>/`)

Each bounded context (e.g., `src/annotations`, `src/atproto`) follows a layered architecture:

```
src/<context>/
├── application/      # Application Layer: Use cases, DTOs, ports/interfaces
│   ├── use-cases/    # Application services orchestrating domain logic
│   ├── dtos/         # Data Transfer Objects for API boundaries
│   ├── repositories/ # Interfaces (Ports) for data persistence
│   └── ports/        # Interfaces (Ports) for other infrastructure (e.g., publishing, external APIs)
├── domain/           # Domain Layer: Core business logic, entities, value objects
│   ├── aggregates/   # Aggregate roots and associated entities
│   └── value-objects/  # Domain value objects
└── infrastructure/   # Infrastructure Layer: Persistence, external services, etc.
    ├── persistence/  # Data persistence implementation (e.g., ORM, database clients)
    └── services/     # Clients for external services (if any)
```

## Reasoning

- **Bounded Contexts:** Top-level directories under `src/` (`annotations`, `atproto`) clearly separate distinct domain areas, reducing coupling and improving clarity.
- **Layered Architecture:** The `domain`, `application`, and `infrastructure` subdirectories within each context enforce separation of concerns.
  - **Domain:** Contains the core business logic, independent of how it's used or stored.
  - **Application:** Orchestrates use cases, acting as a bridge between the domain and infrastructure/UI. Defines interfaces (Ports) needed from infrastructure (e.g., repositories, publishers).
  - **Infrastructure:** Handles technical details like databases, external APIs, etc., implementing interfaces (Adapters) defined in the application layer.
- **Dependency Rule:** Dependencies flow inwards: Infrastructure depends on Application, Application depends on Domain. The Domain layer has no dependencies on outer layers.
- **Organization:** Further subdivision within layers (e.g., `use-cases`, `aggregates`, `value-objects`, `repositories`, `ports`) keeps related code together.
- **Scalability:** This structure makes it easier to add new features, modify existing ones, or even swap out infrastructure components (Adapters) without impacting the core domain logic, as long as the Ports (interfaces) are respected.
- **Lexicon Separation:** The generated `src/lexicon` types are kept separate, acting as a shared kernel or potentially part of the ATProto context's interface, depending on how they are used.

This structure aims for clarity, maintainability, and testability by enforcing clear boundaries and responsibilities.
